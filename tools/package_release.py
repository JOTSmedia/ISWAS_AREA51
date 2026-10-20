#!/usr/bin/env python3
"""Validate this static site; optionally write a reproducible runtime-only ZIP.

Uses Python's standard library and, when available, Node for JavaScript syntax.
No source files are changed. Run from any working directory:
  python3 ISWAS_v16.4/tools/package_release.py --check
  python3 ISWAS_v16.4/tools/package_release.py --output ISWAS_v16.4-release.zip
"""

from __future__ import annotations

import argparse
import hashlib
import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys
from urllib.parse import unquote, urlsplit
import zipfile


ROOT = Path(__file__).resolve().parent.parent
SOURCE_TYPES = {".html", ".js", ".mjs", ".css"}
ASSET_EXTENSIONS = (
    "html|js|mjs|css|json|webmanifest|webp|png|jpe?g|gif|svg|ico|"
    "woff2?|ttf|otf|mp3|ogg|wav|mp4|webm|glb|gltf|bin|ktx2"
)
ASSET_PATH = re.compile(rf"^[\w@./%+~:=-]+\.(?:{ASSET_EXTENSIONS})(?:[?#][^\s]*)?$", re.I)
QUOTED = re.compile(r'''(?P<q>["'`])(?P<v>(?:\\.|(?!(?P=q))[^\\])*)(?P=q)''')
CSS_URL = re.compile(r'''url\(\s*(["']?)(.*?)\1\s*\)''', re.I | re.S)
REQUIRED = (
    "index.html",
    "assets/v9-guide-v17-8.js",
    "assets/popup-behavior-v17-8.js",
    "assets/morgan-bubbles-v17-8.js",
    "assets/morgan-model-v17-8.js",
    "assets/bubble-lifetime-v17-8.js",
    "assets/black-lodge-scene-v17-8.js",
    "assets/camera-clearance-v17-8.js",
    "assets/decorative-books-v17-8.js",
    "assets/horror-locations-data-v17-8.js",
    "assets/horror-globe-ui-v17-8.js",
    "assets/horror-globe-ui-v17-8.css",
    "assets/locations-v17-8.js",
    "assets/globe-zoom-v17-8.js",
    "assets/locations-v17-8.css",
    "locations/index.html",
    "textures/globe-earth-4096.webp",
    "textures/globe-earth-2048.webp",
    "textures/globe-earth-1024.webp",
    "textures/black-lodge/chevron-4096.webp",
    "textures/black-lodge/chevron-1024.webp",
    "textures/black-lodge/upholstery-4096.webp",
    "textures/black-lodge/upholstery-1024.webp",
    "textures/black-lodge/velvet-4096.webp",
    "textures/black-lodge/velvet-1024.webp",
    "characters/morgan/morgan.webp",
    "characters/morgan/morgan-mobile.webp",
    "characters/morgan/wormhole-path.webp",
    "data/variety.json",
    "plates/vincent-price.webp",
    "plates/donnie-darko-mirror.webp",
    "audio/vincent-price-laugh.mp3",
)
NONRUNTIME_DIRS = {".git", ".github", "tools", "tests", "__pycache__", "node_modules"}
RUNTIME_DIRS = {"audio", "assets", "plates", "portraits", "textures", "characters", "fonts", "books", "data"}


def source_document(path: Path) -> bool:
    """Exclude authoring history/provenance, while preserving any license files."""
    name = path.name.lower()
    if name.startswith(("license", "copying", "notice", "ofl")):
        return False
    return (
        name.startswith(("readme", "changes", "sources", "provenance", "asset_provenance"))
        or path.suffix.lower() in {".md", ".py", ".pyc", ".blend", ".psd", ".xcf", ".zip"}
        or "provenance" in name
        or name in {"reference.png", "morgan-source.png", "horror-globe.html", ".ds_store", ".gitignore", ".gitattributes"}
    )


def candidate_files() -> list[Path]:
    return sorted(
        path for path in ROOT.rglob("*")
        if path.is_file()
        and not (set(path.relative_to(ROOT).parts) & NONRUNTIME_DIRS)
        and not source_document(path)
    )


class PageReferences(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.refs: list[str] = []
        self.script_depth = 0
        self.scripts: list[str] = []
        self.styles: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = dict(attrs)
        if tag == "script":
            self.script_depth += 1
        for key in ("href", "src", "poster", "data-src"):
            if data.get(key):
                self.refs.append(data[key] or "")
        if data.get("srcset"):
            self.refs.extend(item.strip().split()[0] for item in data["srcset"].split(",") if item.strip())
        if data.get("style"):
            self.styles.append(data["style"] or "")

    def handle_endtag(self, tag: str) -> None:
        if tag == "script":
            self.script_depth = max(0, self.script_depth - 1)

    def handle_data(self, data: str) -> None:
        if self.script_depth:
            self.scripts.append(data)


def static_literals(text: str) -> set[str]:
    """Only complete, literal asset paths; skip templates and partial strings.

    Bare image names in JavaScript are often comparison keys rather than URLs.
    Those cannot establish a base directory, so they are intentionally skipped.
    The separately validated book range covers this site's dynamic cover paths.
    """
    return {
        value for match in QUOTED.finditer(text)
        if "${" not in (value := match["v"])
        and "\\" not in value and "/" in value and ASSET_PATH.fullmatch(value)
    }


def local_path(source: Path, reference: str) -> Path | None:
    reference = html.unescape(reference).strip()
    if not reference or reference.startswith(("#", "//")):
        return None
    parsed = urlsplit(reference)
    if parsed.scheme or parsed.netloc:
        return None
    value = unquote(parsed.path)
    if not value or "${" in value or "\\" in value:
        return None
    if value.startswith("/"):
        # Runtime asset helpers resolve leading slashes against __ISWAS_BASE.
        value = value.lstrip("/")
        if value.startswith(ROOT.name + "/"):
            value = value[len(ROOT.name) + 1:]
        target = ROOT / value
    elif source.suffix.lower() in {".js", ".mjs"} and not value.startswith(("./", "../")):
        target = ROOT / value
    else:
        target = source.parent / value
        # Route snapshots redirect to the version root before mounting. Inline
        # bootstrap strings and style assets there also resolve at that base.
        if (not target.exists() and value.split("/", 1)[0] in RUNTIME_DIRS
                and (ROOT / value).is_file()):
            target = ROOT / value
    target = target.resolve()
    if not target.is_relative_to(ROOT):
        raise ValueError(f"path escapes the site: {reference}")
    if target.is_dir():
        target /= "index.html"
    return target


def validate(files: list[Path], node: str | None) -> tuple[set[Path], list[str]]:
    failures: list[str] = []
    referenced: set[Path] = set()
    file_set = set(files)
    source_count = reference_count = script_count = 0
    for relative in REQUIRED:
        path = ROOT / relative
        if not path.is_file() or not path.stat().st_size:
            failures.append(f"Required runtime file missing or empty: {relative}")

    covers = [ROOT / "books" / f"afi-{rank:03d}.webp" for rank in range(1, 101)]
    for cover in covers:
        if not cover.is_file():
            failures.append(f"Missing movie cover: {cover.relative_to(ROOT)}")
        else:
            header = cover.read_bytes()[:12]
            if header[:4] != b"RIFF" or header[8:12] != b"WEBP" or cover.stat().st_size < 100:
                failures.append(f"Invalid or empty WebP cover: {cover.relative_to(ROOT)}")
    try:
        rows = json.loads((ROOT / "data/variety.json").read_text())
        if not isinstance(rows, list) or len(rows) != 100 or {row[0] for row in rows} != set(range(1, 101)):
            failures.append("Library data must contain exactly the 100 cover ranks (1–100).")
    except (OSError, ValueError, TypeError, IndexError) as error:
        failures.append(f"Cannot validate library data: {error}")

    try:
        location_module = (ROOT / "assets/horror-locations-data-v17-8.js").read_text()
        start = location_module.index("export const HORROR_LOCATIONS = ") + len("export const HORROR_LOCATIONS = ")
        locations = json.JSONDecoder().raw_decode(location_module[start:])[0]
        valid = isinstance(locations, list) and len(locations) == 200
        valid = valid and len({record["id"] for record in locations}) == 200
        valid = valid and all(
            -90 <= record["lat"] <= 90 and -180 <= record["lon"] <= 180
            and record["status"] in {"open", "outside", "gone"}
            for record in locations
        )
        if not valid:
            failures.append("Location data must contain 200 unique IDs with valid coordinates and visiting-status values.")
    except (OSError, ValueError, TypeError, KeyError) as error:
        failures.append(f"Cannot validate filming locations: {error}")

    for source in files:
        if source.is_symlink():
            failures.append(f"Runtime file must not be a symlink: {source.relative_to(ROOT)}")
        if source.suffix.lower() not in SOURCE_TYPES:
            continue
        source_count += 1
        content = source.read_text(encoding="utf-8")
        relative = source.relative_to(ROOT)
        if re.search(r"https?://(?:www\.)?grok\.com/[^\s\"'`<>]*\.js", content, re.I):
            failures.append(f"Remote Grok script remains in {relative}")
        if re.search(r"https?://(?:localhost|127\.0\.0\.1|0\.0\.0\.0):\d+", content, re.I):
            failures.append(f"Development server URL remains in {relative}")
        references: set[str] = set()
        inline_scripts: list[str] = []
        if source.suffix.lower() == ".html":
            page = PageReferences()
            page.feed(content)
            references.update(page.refs)
            inline_scripts = page.scripts
            for script in inline_scripts:
                references.update(static_literals(script))
            for style in page.styles:
                references.update(match[2] for match in CSS_URL.finditer(style))
        elif source.suffix.lower() == ".css":
            references.update(match[2] for match in CSS_URL.finditer(content))
        else:
            references.update(static_literals(content))
        for reference in sorted(references):
            try:
                target = local_path(source, reference)
            except ValueError as error:
                failures.append(f"{relative}: {error}")
                continue
            if target is None:
                continue
            reference_count += 1
            referenced.add(target)
            if not target.is_file():
                failures.append(f"Missing local reference in {relative}: {reference}")
            elif target not in file_set:
                failures.append(f"Referenced asset would be excluded from the release: {reference} ({relative})")
        if node and source.suffix.lower() in {".js", ".mjs"}:
            inline_scripts = [content]
        if node:
            for script in inline_scripts:
                if not script.strip():
                    continue
                result = subprocess.run(
                    [node, "--check", "--input-type=module"], input=script,
                    capture_output=True, text=True, check=False,
                )
                script_count += 1
                if result.returncode:
                    failures.append(f"JavaScript syntax error in {relative}:\n{result.stderr.strip()}")

    print(f"Checked {source_count} HTML/JS/CSS files, {reference_count} resolvable local references, 100 movie covers, and 200 filming locations.")
    if node:
        print(f"Node syntax checks: {script_count} scripts.")
    else:
        print("Node was not found; JavaScript syntax checks were skipped. Use --node /path/to/node to enable them.")
    return referenced, failures


def runtime_files(files: list[Path], referenced: set[Path]) -> list[Path]:
    """Keep all runtime assets, removing only unreferenced replaced originals."""
    return [
        path for path in files
        if not (
            path.suffix.lower() in {".jpg", ".jpeg", ".png"}
            and path.with_suffix(".webp").is_file()
            and path not in referenced
        )
    ]


def write_release(output: Path, files: list[Path]) -> None:
    if output.is_relative_to(ROOT):
        raise ValueError("Write the release ZIP outside the version folder so it cannot package itself.")
    if not output.parent.is_dir():
        raise ValueError(f"Output directory does not exist: {output.parent}")
    notes = (
        f"{ROOT.name} — STATIC RELEASE\n\n"
        "Extract these contents into the web server's chosen site folder. Preserve all relative paths.\n"
        "Use an HTTP(S) static server; opening index.html directly as a file is not supported.\n"
        "The same files support a site at the domain root or in a version subfolder.\n"
        "No build step or external Grok runtime is required. Browser WebGL is required for the 3D gallery.\n\n"
        "Validation checks literal local asset paths, JavaScript syntax when Node is available,\n"
        "required Morgan and globe modules, all 100 local book covers, all six lodge material maps,\n"
        "three map texture tiers, and 200 valid location records. Dynamic URL expressions cannot\n"
        "be exhaustively checked by static analysis; visual/browser verification remains necessary.\n\n"
        "The source workspace retains version history, source images, provenance, and tools.\n"
        "This deployment archive excludes those documents, Git data, and unused replaced image originals.\n"
        "Any existing license/notice files are retained. No deployment is performed by packaging.\n"
    )
    manifest = {
        path.relative_to(ROOT).as_posix(): {
            "bytes": path.stat().st_size,
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        }
        for path in files
    }
    entries = [(path.relative_to(ROOT).as_posix(), path.read_bytes()) for path in files]
    entries.extend([
        ("README-SHIPPING.txt", notes.encode("utf-8")),
        ("RELEASE-MANIFEST.json", (json.dumps(manifest, indent=2, sort_keys=True) + "\n").encode("utf-8")),
    ])
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name, data in sorted(entries):
            info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            archive.writestr(info, data, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
    print(f"Created {output} ({output.stat().st_size / 1024 / 1024:.1f} MiB; {len(files)} runtime files).")
    print(f"SHA-256: {hashlib.sha256(output.read_bytes()).hexdigest()}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--check", action="store_true", help="validate only (the default)")
    group.add_argument("--output", type=Path, help="write a reproducible release ZIP outside the version folder")
    parser.add_argument("--node", help="path to Node; defaults to node on PATH")
    args = parser.parse_args()
    node = args.node or shutil.which("node")
    if args.node and not Path(args.node).is_file():
        parser.error(f"Node executable does not exist: {args.node}")
    files = candidate_files()
    referenced, failures = validate(files, node)
    if failures:
        for failure in failures:
            print(f"ERROR: {failure}", file=sys.stderr)
        print(f"Validation failed ({len(failures)} issues); no release was written.", file=sys.stderr)
        return 1
    release_files = runtime_files(files, referenced)
    total_bytes = sum(path.stat().st_size for path in release_files)
    print(f"Validation passed. {len(release_files)} runtime files selected ({total_bytes / 1024 / 1024:.2f} MiB uncompressed); source workspace unchanged.")
    if args.output:
        try:
            write_release(args.output.expanduser().resolve(), release_files)
        except ValueError as error:
            parser.error(str(error))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
