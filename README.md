# Ashkan Yousefi Zadeh Portfolio

Personal website for GitHub Pages, rebuilt with `@wkocjan/gatsby-theme-intro`.

## Local development

```bash
npm install
npm run develop
```

## Build

```bash
npm run build
```

The GitHub Pages workflow builds Gatsby and deploys the generated `public/` folder.

Note: Gatsby 3 can fail when this repository is built from a path containing an apostrophe, such as `Ashkan's-PhD`. GitHub Actions builds from a clean checkout path, and local verification was completed from `/private/tmp/ashkan-website-build`.
