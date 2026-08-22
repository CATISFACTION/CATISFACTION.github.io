# Maya Voss Portfolio

Premium static portfolio website for a professional 3D Visualizer and Interior Designer.

Built with Astro, Tailwind CSS, Astro Content Collections, MDX, Motion One, Lucide icons, Decap CMS, and GitHub Pages.

Production URL:

```text
https://catisfaction.github.io
```

## Local Development

Install dependencies:

```bash
npm install
```

Run the local site:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Project Structure

```text
src/content/projects/      Project MDX files
src/data/profile.json      Profile, bio, skills, software, and contact data
public/uploads/            CMS-uploaded images
public/admin/              Decap CMS admin app and config
src/pages/                 Website routes
src/components/            Reusable UI components
```

## Editing Profile Information

Profile content lives in `src/data/profile.json`.

Editable fields include:

- name
- role/title
- hero headline
- short introduction
- profile photo
- biography
- experience
- skills
- software expertise
- email
- phone
- LinkedIn
- Behance
- availability note

The same file is exposed in Decap CMS under **Profile and Contact**.

## Adding Projects

Projects live in `src/content/projects/` as MDX files with frontmatter.

Required fields:

- `title`
- `slug`
- `location`
- `area`
- `excerpt`
- `description`
- `coverImage`
- `gallery`

Optional fields:

- `youtubeUrl`
- `year`
- `category`
- `software`
- `tags`
- `featured`

Each project page is created automatically from the `slug` field:

```text
/projects/example-project/
```

## Uploading Images

Images are stored under:

```text
public/uploads/
```

Recommended folders:

```text
public/uploads/profile/
public/uploads/projects/project-slug/
```

Use descriptive alt text for every image. This improves accessibility and makes the portfolio easier to maintain.

## Using Decap CMS

The CMS is available at:

```text
https://catisfaction.github.io/admin/
```

The CMS can edit:

- profile and contact information
- projects
- project metadata
- cover images
- project galleries
- rich project content

### Important GitHub Pages Authentication Note

Decap CMS is implemented in this project and configured to use the GitHub backend.

GitHub Pages is static hosting, so it cannot run the OAuth server required for GitHub login. To make `/admin/` login work in production, connect Decap CMS to an external OAuth provider or proxy, then update `public/admin/config.yml` with the provider's `base_url` and, if required, `auth_endpoint`.

Typical options:

- DecapBridge
- a small OAuth proxy hosted on Cloudflare Workers
- another Decap-compatible GitHub OAuth service

After the auth provider is connected, the editor must have push access to the repository or be invited through the provider's access system.

## Deployment

Deployment uses GitHub Actions in:

```text
.github/workflows/deploy.yml
```

Every push to `main` runs:

```bash
npm ci
npm run build
```

The generated `dist/` folder is then deployed to GitHub Pages.

## GitHub Pages Configuration

The repository must be named:

```text
CATISFACTION.github.io
```

Expected Pages settings:

1. Open the GitHub repository.
2. Go to **Settings**.
3. Go to **Pages**.
4. Under **Build and deployment**, set **Source** to **GitHub Actions**.
5. Save if GitHub shows a save button.
6. Open the **Actions** tab and confirm the latest deployment workflow passes.

## Theme System

The site supports:

- light mode
- dark mode
- system mode

The visitor's choice is saved in `localStorage`. If no manual choice is saved, the site follows `prefers-color-scheme`.

## SEO and Indexing

The site includes:

- title templates
- meta descriptions
- Open Graph tags
- favicon
- sitemap
- `robots.txt`

`robots.txt` intentionally discourages indexing because the portfolio is intended primarily for direct sharing.

## Maintenance Notes

- Keep project slugs lowercase and URL-safe.
- Keep image filenames lowercase with hyphens.
- Add alt text for every uploaded image.
- Mark only the strongest projects as `featured`.
- Run `npm run build` before pushing structural changes.

