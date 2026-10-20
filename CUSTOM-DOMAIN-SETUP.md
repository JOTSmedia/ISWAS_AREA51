# Keep itstartedwithascream.com in the address bar

The domain currently uses Squarespace DNS and an HTTP 302 forwarding rule to https://jotsmedia.github.io/ISWAS_web/. Forwarding changes the browser address. Connect the domain directly to GitHub Pages instead.

## 1. Configure GitHub first

Open https://github.com/jotsmedia/ISWAS_web/settings/pages . Under Custom domain, enter `itstartedwithascream.com` and Save. If publishing from a branch, keep the included `CNAME` file at the publishing root. If using GitHub Actions, the repository Pages setting is authoritative.

Upload the contents of `ISWAS_v17.13-release.zip` to the publishing root of ISWAS_web, rather than putting the version folder inside it. The package contains a CNAME file with the domain and uses relative routes/assets that work at the custom-domain root.

## 2. Point Squarespace DNS to GitHub

In Squarespace Domains, select itstartedwithascream.com. Remove the website forwarding rule pointing to jotsmedia.github.io/ISWAS_web/. In DNS Settings, replace the Squarespace website A records with these four records:

| Type | Host | Value |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | jotsmedia.github.io |

The www CNAME points only to jotsmedia.github.io, without a repository name or slash. Keep existing email MX records and unrelated verification/TXT records. No nameserver change is required.

## 3. Finish HTTPS

Once GitHub's DNS check succeeds, enable Enforce HTTPS in repository Settings → Pages. DNS/certificate changes may take up to 24 hours. The final site should open as https://itstartedwithascream.com/ and sections as https://itstartedwithascream.com/locations/ etc. GitHub continues hosting the files while the custom domain remains visible.

These account/DNS settings have not been changed by the local package.

Official references:
- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- https://support.squarespace.com/hc/en-us/articles/360002101888-Edit-your-domain-s-DNS-records
- https://support.squarespace.com/hc/en-us/articles/214767107-Forwarding-a-domain
