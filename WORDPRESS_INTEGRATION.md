# WordPress integration contract

This document describes the boundary expected by the current frontend. The WordPress REST controllers, PHP enqueue code, authentication bridge, and rewrite rules are intentionally not implemented in this repository yet.

## Runtime configuration

The Vite variables are build-time values:

| Variable | Purpose | Example |
| --- | --- | --- |
| `VITE_DATA_SOURCE` | Adapter set selected by the runtime composition root | `mock` or `wordpress` |
| `VITE_API_BASE_URL` | Base URL for the future REST adapters | `/wp-json/museum/v1` |
| `VITE_APP_BASE_PATH` | React Router basename, without a trailing slash | `/` or `/book-of-remembrance` |
| `VITE_ASSET_BASE` | Public base used by Vite assets and the service worker | `/` or `/book-of-remembrance/` |
| `VITE_SCREEN_IDLE_TIMEOUT_MS` | Kiosk inactivity timeout | `90000` |

Development defaults to `mock` if `VITE_DATA_SOURCE` is absent. A production runtime must select the mode explicitly; it never silently falls back to mock. `src/app/providers/runtime.ts` is the single composition root for auth and all repositories. The `wordpress` branch deliberately fails until real adapters are connected there.

`VITE_APP_BASE_PATH` and `VITE_ASSET_BASE` must describe the same deployment mount. Neither value contains a domain. For a nested deployment, a representative build is:

```sh
VITE_DATA_SOURCE=wordpress \
VITE_APP_BASE_PATH=/book-of-remembrance \
VITE_ASSET_BASE=/book-of-remembrance/ \
npm run build
```

## Expected REST surface

The exact PHP route names may still be chosen, but the WordPress adapters must provide these domain operations.

Staff, authenticated:

| Domain operation | Suggested endpoint |
| --- | --- |
| `HeroesRepository.getList(query)` | `GET /wp-json/museum/v1/heroes` |
| `HeroesRepository.getById(id)` | `GET /wp-json/museum/v1/heroes/{id}` |
| create/update/delete hero | `POST /heroes`, `PUT /heroes/{id}`, `DELETE /heroes/{id}` |
| list/get/create/update/delete district | corresponding `/districts` routes |
| list/upload/delete media | corresponding `/media` routes, or a deliberate adapter over WordPress media routes |

The hero list endpoint accepts `page`, `per_page`, `search`, `district_id`, `status`, and `order`. Its response must map to `PagedResult<Hero>` with `items`, `page`, `perPage`, `total`, and `totalPages`. The server owns filtering, pagination, permissions, and its maximum `per_page` value.

Public screen, unauthenticated and read-only:

| Domain operation | Endpoint |
| --- | --- |
| `ScreenContentRepository.getSnapshot()` | `GET /wp-json/museum/v1/screen` |
| `ScreenContentRepository.getVersion()` | `GET /wp-json/museum/v1/screen/version` |

The snapshot is one consistent payload containing `version`, public `districts`, public `heroes`, and optional `generatedAt`. The public controller must exclude drafts, not-yet-published records, private fields, and original archive media URLs. This rule must be enforced by PHP as well as by the frontend. A hero detail route is resolved only from this public snapshot, so `/screen/heroes/{id}` cannot use the staff `getById` operation as a fallback.

## DTO and domain boundary

REST DTOs belong inside the future WordPress adapter layer. Only that layer should know WordPress field names, snake_case parameters, `_embedded` media, nullable REST fields, or pagination headers. It maps DTOs to the types in `src/shared/types` and `src/repositories` before returning data to services and UI.

Mapping should be explicit in both directions:

- WordPress hero/district/media DTO to domain model;
- `HeroFormData` and `DistrictFormData` to write DTO;
- WordPress list response and headers to `PagedResult<T>`;
- public snapshot DTO to `ScreenContentSnapshot`.

Mapper tests have a reserved location at `tests/unit/mappers/`. UI components must not import WordPress DTOs.

## Authentication and nonce

The target is same-origin WordPress cookie authentication, not JWT. No bearer-token storage is expected in localStorage, sessionStorage, IndexedDB, or application cookies.

Every authenticated REST request must use:

```ts
fetch(url, {
  credentials: 'include',
  headers: { 'X-WP-Nonce': nonce },
});
```

WordPress/PHP should expose the current REST nonce to the application bootstrap (for example via an inline configuration object emitted before the module script). The client must treat it as runtime data, not a Vite secret. On an expired nonce, the adapter should obtain a fresh nonce through an authenticated same-origin mechanism or send the user through WordPress login again; it must not replace this flow with JWT.

`AuthService` remains the frontend boundary. The preferred deployment protects `/staff` with WordPress login and implements `getCurrentUser()` through the authenticated WordPress session. If the existing in-app login form is retained, PHP must additionally expose explicit login/logout endpoints that establish and clear WordPress cookies and return/refresh the nonce. Authorization is always rechecked in each REST controller with WordPress capabilities; the protected React route is only UI behavior.

## Manifest and asset loading

`build.manifest = true` generates `dist/manifest.json` with the current Vite version. PHP should read that file, find the application entry, enqueue its hashed JavaScript with `wp_enqueue_script()`/`wp_enqueue_script_module()` as appropriate, and enqueue every listed CSS file with `wp_enqueue_style()`. PHP must never hardcode hashed filenames.

Static imports, fonts, and icons receive URLs derived from `VITE_ASSET_BASE`. The generated `sw.js` also resolves its precache list relative to its registration scope; it does not hardcode `/assets`. The service worker must be served from the configured mount path with a JavaScript MIME type and an allowed scope covering that mount.

The WordPress host template must render exactly one application container:

```html
<div id="root" class="book-of-remembrance-root"></div>
```

The frontend also adds this namespace defensively. General/reset rules are scoped to it; CSS Modules scope page and component styles. WordPress theme styles may still need isolation on the host template if they use unusually broad or `!important` selectors.

## Router and rewrite rules

The app uses browser history with `VITE_APP_BASE_PATH` as React Router's basename; it does not use hash routing. WordPress/web-server rewrites must return the same host page for all application routes, including direct requests and reloads:

- `{base}/screen` and every nested screen route;
- `{base}/staff`, `{base}/staff/login`, and every nested staff route.

Rewrites must not intercept `{base}/assets/*`, `{base}/sw.js`, `/wp-json/*`, WordPress admin paths, or real static files. HTTPS and same-origin hosting are required for cookie auth and production service workers.

## Offline boundary

Offline behavior applies only to `/screen`:

- IndexedDB stores one atomic active `CachedScreenContent` snapshot;
- cache age over seven days is stale metadata, not expiration;
- a changed remote version is downloaded and persisted before activation;
- a failed refresh leaves the previous snapshot active;
- optimized screen media is stored in the app-specific media cache;
- the service worker caches the generated app shell and handles offline screen navigation;
- “Clear cache” deletes only the app's IndexedDB database and Cache Storage entries prefixed with `book-of-remembrance-`.

Staff editing remains online-only. WordPress must increment the public version only when the complete public snapshot changes and must return a self-consistent snapshot for that announced version.

## Adapter hand-off checklist

1. Implement DTO types and pure mappers with unit tests.
2. Implement WordPress auth, staff, and public-screen adapters.
3. Add them only to the `wordpress` branch in `src/app/providers/runtime.ts`.
4. Pass the nonce into the adapter composition from WordPress bootstrap data.
5. Build with matching app and asset bases, then enqueue from the manifest.
6. Add rewrite/fallback rules and verify direct nested-route reloads.
7. Verify on the server that anonymous users cannot retrieve drafts or staff-only fields.
