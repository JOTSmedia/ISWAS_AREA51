# Custom domain and HTTPS — verified October 20, 2026

The domain is connected directly to GitHub Pages. DNS check succeeded. GitHub issued a trusted TLS certificate, and Enforce HTTPS is enabled in JOTSmedia/ISWAS_web → Settings → Pages. A normal certificate-verified HTTPS request succeeds, and HTTP returns a 301 redirect to HTTPS. No certificate warning was bypassed.

Keep the custom domain set to itstartedwithascream.com. Keep CNAME and .nojekyll at the publishing root. Do not remove/re-add the domain or restore registrar forwarding.

DNS uses the four GitHub Pages A records: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153. The www CNAME points to jotsmedia.github.io.

Upload the extracted contents of ISWAS_v18.1-release.zip into the repository publishing root (main branch, / root), preserving folders. Do not nest the version folder inside the publishing root. Packaging does not deploy the release.

The text-message preview uses the HTTPS image URL /plates/share-black-lodge-v18-1.jpg. That file becomes publicly available only after this release is uploaded and GitHub finishes deployment. Messaging applications may retain an earlier preview in their cache; the site cannot force every recipient application to refresh immediately.

Run tools/check-live-https.py after deployment to check the trusted certificate, HTTP redirect, and public preview JPEG. Before this release is deployed, the image check is expected to fail.

Official reference: https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https
