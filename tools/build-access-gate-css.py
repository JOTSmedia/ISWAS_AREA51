#!/usr/bin/env python3
"""Extract the public gate's exact CSS cascade without changing the full sheet.

Run this after changing the gate markup or the presentation stylesheet. Requires
tinycss2 and cssselect2. Rules retain their complete selector lists, declarations,
source order, cascade layers, media/supports wrappers, fonts, and used keyframes.
Interaction states are broadened only while deciding which rules to retain;
the emitted selectors are the original selectors.
"""
from html.parser import HTMLParser
from pathlib import Path
import re
from xml.etree.ElementTree import Element, SubElement

import cssselect2
import tinycss2

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'assets/styles-v18-1.css'
OUTPUT = ROOT / 'assets/access-gate-base-v18-1.css'
VOID = set('area base br col embed hr img input link meta param source track wbr'.split())
STATES = ('hover', 'active', 'focus-visible', 'focus-within', 'focus', 'visited',
          'link', 'any-link', 'checked', 'indeterminate', 'disabled', 'enabled',
          'required', 'optional', 'valid', 'invalid', 'user-valid', 'user-invalid',
          'read-only', 'read-write', 'placeholder-shown', 'open', 'target')
STATE_PATTERN = '|'.join(sorted(STATES, key=len, reverse=True))


class GateParser(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.document = Element('document')
        self.stack = [self.document]
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        node = SubElement(self.stack[-1], tag, {key: value or '' for key, value in attrs})
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        SubElement(self.stack[-1], tag, {key: value or '' for key, value in attrs})

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                self.stack = self.stack[:index]
                return


def parse_rules(content):
    rules = tinycss2.parse_rule_list(content, skip_comments=True, skip_whitespace=True)
    errors = [rule for rule in rules if rule.type == 'error']
    if errors:
        raise ValueError(f'Cannot safely extract CSS containing parse errors: {errors}')
    return rules


def matching_selector(selector, nodes):
    # Public dialog and inputs can change focus, validity, disabled, and open
    # states. Retain both their positive and simple negative interaction rules.
    possible = re.sub(r':not\(\s*:(?:' + STATE_PATTERN + r')\s*\)', '', selector)
    possible = re.sub(r'(?<!:):(?:' + STATE_PATTERN + r')(?![\w-])', '', possible)
    possible = re.sub(r'\[(?:open|disabled|aria-busy|aria-invalid)(?:[^\]]*)\]', '', possible)
    possible = re.sub(r'\.is-filled(?![\w-])', '', possible)
    try:
        selectors = cssselect2.compile_selector_list(possible)
    except cssselect2.SelectorError:
        # Vendor pseudo elements and future selector syntax stay intact.
        return True
    return any(selector.test(node) for selector in selectors for node in nodes)


def extract():
    html = (ROOT / 'index.html').read_text()
    if 'class="access-gated"' not in html or 'id="pin-dialog"' not in html:
        raise ValueError('Build the public access gate before extracting its stylesheet')
    tree = GateParser(html).document.find('html')
    if tree is None:
        raise ValueError('The gate has no HTML root')
    nodes = tuple(cssselect2.ElementWrapper.from_html_root(tree).iter_subtree())
    source = SOURCE.read_text()
    rules = tinycss2.parse_stylesheet(source, skip_comments=True, skip_whitespace=True)
    kept = set()
    children = {}
    keyframes = []

    def select(items):
        for rule in items:
            if rule.type == 'error':
                raise ValueError(f'Cannot safely extract CSS: {rule}')
            if rule.type == 'qualified-rule':
                if matching_selector(tinycss2.serialize(rule.prelude), nodes):
                    kept.add(id(rule))
            elif rule.type == 'at-rule':
                name = rule.lower_at_keyword
                if name.endswith('keyframes'):
                    keyframes.append(rule)
                elif name in ('media', 'supports', 'layer', 'container', 'scope') and rule.content is not None:
                    nested = parse_rules(rule.content)
                    children[id(rule)] = nested
                    select(nested)
                else:
                    # Font faces, property definitions, and layer ordering are
                    # dependencies of the original cascade, not page features.
                    kept.add(id(rule))

    def emit(items):
        pieces = []
        for rule in items:
            nested = children.get(id(rule))
            if nested is not None:
                content = emit(nested)
                if content:
                    pieces.append('@' + rule.at_keyword + tinycss2.serialize(rule.prelude) + '{' + content + '}')
            elif id(rule) in kept:
                pieces.append(tinycss2.serialize([rule]))
        return ''.join(pieces)

    select(rules)
    selected = emit(rules)
    for rule in keyframes:
        name = tinycss2.serialize(rule.prelude).strip().strip('\"\'')
        if re.search(r'(?<![\w-])' + re.escape(name) + r'(?![\w-])', selected):
            kept.add(id(rule))
    license_comment = source.split('*/', 1)[0] + '*/\n' if source.startswith('/*!') else ''
    result = license_comment + '/* Generated by tools/build-access-gate-css.py; preserve the source cascade. */\n' + emit(rules) + '\n'
    parse_rules(result)
    OUTPUT.write_text(result)
    before = SOURCE.stat().st_size
    after = OUTPUT.stat().st_size
    print(f'Gate base CSS: {before:,} -> {after:,} bytes; {before - after:,} bytes saved ({(before - after) / before:.2%}).')


if __name__ == '__main__':
    extract()
