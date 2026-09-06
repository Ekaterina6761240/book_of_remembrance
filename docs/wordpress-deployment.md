# Future WordPress deployment

The frontend build is configurable for both root and nested deployments. These
settings are compile-time values and should be set before running `npm run build`:

- `VITE_APP_BASE_PATH` is the public URL prefix where the SPA routes live. Use
  `/` for `/screen` and `/staff`, or `/book-of-remembrance` for
  `/book-of-remembrance/screen` and `/book-of-remembrance/staff`.
- `VITE_ASSET_BASE` is the public URL prefix from which the generated JavaScript,
  CSS, fonts, and images are served. It may be a site-relative directory or an
  absolute CDN URL and is not tied to a domain in the source code.

Vite writes `dist/manifest.json`. A future WordPress integration should read the
`index.html` entry in that manifest and enqueue its JavaScript file and every CSS
file listed for the entry. The emitted JavaScript entry must be loaded as an ES
module. WordPress must also render a mount element with the `root` id; the app
adds the `book-of-remembrance-root` namespace class when it starts.

Because the application uses browser history rather than hash routing, the web
server and WordPress must provide an SPA rewrite/fallback. Requests below the
configured base path, including nested `/screen/*` and `/staff/*` routes, must
serve the frontend shell when no real WordPress resource matches. The rewrite
must leave WordPress administration, API, uploaded files, and built asset URLs
untouched.
