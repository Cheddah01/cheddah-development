# Cheddah Development

The public hub and portfolio for Cheddah Development Minecraft plugins.

## Local development

```bash
npm install
npm run dev
```

## Deployment

Pushing `main` deploys the static site to GitHub Pages through the included workflow.

The workflow currently uses `/cheddah-development` as the GitHub Pages base path. When a custom domain is connected, remove the `NEXT_PUBLIC_BASE_PATH` value from `.github/workflows/deploy-pages.yml`, update `metadataBase` and absolute social-image URLs in `app/layout.tsx`, and add the domain as `public/CNAME`.
