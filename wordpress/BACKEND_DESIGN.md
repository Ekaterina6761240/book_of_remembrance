# Backend design: WordPress plugin `museum-core`

## 1. Статус документа

Это проект backend-архитектуры для существующего frontend приложения «Книга памяти». Документ не является реализацией: PHP-код, REST-контроллеры, WordPress hooks, rewrite rules и frontend adapters на этом этапе не создаются.

Целевая структура размещения plugin:

```text
wordpress/
└── museum-core/
    ├── museum-core.php
    ├── src/
    │   ├── Content/
    │   ├── Rest/
    │   ├── Auth/
    │   ├── Media/
    │   ├── Screen/
    │   └── Frontend/
    └── public/
        └── build/
```

Структура выше — ориентир для следующего этапа, а не список файлов, создаваемых сейчас.

## 2. Зафиксированные frontend-контракты

Backend должен реализовывать существующие интерфейсы через будущие WordPress adapters, не передавая `WP_Post`, `WP_Term`, `WP_User` или WordPress REST payload непосредственно в UI.

### Staff

```ts
interface HeroesRepository {
  getList(query: HeroQuery): Promise<PagedResult<Hero>>;
  getById(id: number): Promise<Hero>;
  create(data: HeroFormData): Promise<Hero>;
  update(id: number, data: HeroFormData): Promise<Hero>;
  delete(id: number): Promise<void>;
}

type HeroQuery = {
  page?: number;
  perPage?: number;
  search?: string;
  districtId?: number;
  status?: 'draft' | 'scheduled' | 'published';
  sortOrder?: 'asc' | 'desc';
};

type PagedResult<T> = {
  items: T[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};
```

Также существуют `DistrictsRepository`, `MediaRepository` и `AuthService`. Upload должен поддерживать progress callback, поэтому WordPress media adapter может использовать `XMLHttpRequest` для multipart upload, даже если остальные adapters используют `fetch`.

### Public screen

```ts
interface ScreenContentRepository {
  getSnapshot(): Promise<ScreenContentSnapshot>;
  getVersion(): Promise<number>;
}

type ScreenContentSnapshot = {
  version: number;
  districts: District[];
  heroes: Hero[];
  generatedAt?: string;
};
```

Public list, поиск, алфавит, фильтр по району и страница героя работают локально с одним snapshot. Отдельного публичного `GET /heroes/{id}` быть не должно. Staff `getById()` нельзя использовать как fallback для `/screen/heroes/:id`.

### Router и runtime

- Browser router, без hash routing.
- Корневые frontend routes: `/screen`, `/screen/districts`, `/screen/heroes`, `/screen/heroes/:id`, `/staff`, `/staff/login`.
- `VITE_APP_BASE_PATH` задаёт `APP_BASE_PATH`: общий mount path, React basename, SPA routes и будущий scope service worker.
- `VITE_ASSET_BASE` определяет только публичный URL Vite build assets и не должен определять scope service worker.
- `VITE_DATA_SOURCE=mock|wordpress` выбирается в единственной composition root `src/app/providers/runtime.ts`.
- WordPress adapters должны подключаться только в ветке `wordpress`.

## 3. Границы plugin

`museum-core` отвечает за:

- регистрацию `museum_hero`;
- регистрацию `museum_district`;
- связь героев с WordPress attachments;
- роль `museum_editor` и capabilities;
- custom REST namespace `museum/v1`;
- WordPress cookie authentication и REST nonce;
- построение согласованного public snapshot;
- версию публичного контента;
- чтение Vite manifest и подключение React build;
- SPA mount point и rewrite/fallback.

Plugin не создаёт отдельные таблицы пользователей или героев. Источники истины:

- герой — `wp_posts` + зарегистрированные post meta;
- район — `wp_terms`/`wp_term_taxonomy` + term meta;
- media — attachment posts и attachment metadata;
- пользователь — `wp_users` и WordPress roles/capabilities.

Прямой SQL не применяется, пока задачу можно корректно решить через WordPress APIs.

## 4. Content model

### 4.1 Custom Post Type `museum_hero`

Рекомендуемые параметры:

- `public: false`;
- `publicly_queryable: false`;
- `exclude_from_search: true`;
- `show_ui: true`;
- `show_in_menu: true`;
- `show_in_rest: false`, чтобы raw CPT не появился в `/wp/v2`;
- `capability_type: ['museum_hero', 'museum_heroes']`;
- `map_meta_cap: true`;
- supports: `title`, `thumbnail`.

`post_title` хранит автоматически сформированное полное имя для удобства WordPress internals и поиска. Каноническими значениями остаются отдельные поля имени; произвольное редактирование title через API запрещено.

React `/staff` остаётся основным интерфейсом сотрудников. Обычный wp-admin используется administrator как diagnostic/fallback CMS. Для этого plugin должен предоставить administrator безопасные meta boxes/поля для всех данных Hero и применять те же validation, sanitization, status и snapshot rules, что custom REST API. Чтобы wp-admin не стал вторым штатным интерфейсом `museum_editor`, CPT menu следует скрыть для этой роли отдельно от REST capabilities; administrator продолжает видеть его. Raw CPT при этом не публикуется через core REST.

### 4.2 Taxonomy `museum_district`

- привязана только к `museum_hero`;
- неплоская или плоская taxonomy — рекомендуется `hierarchical: false`, поскольку frontend не поддерживает иерархию;
- `public: false`;
- `show_in_rest: false` для core REST;
- один герой обязан иметь ровно один district;
- порядок хранится в term meta `museum_sort_order`.

Удаление term запрещается, если на него ссылается хотя бы один герой независимо от статуса. REST возвращает `409 district_in_use`, а не молча снимает связи.

### 4.3 Hero status

Отложенная публикация — обязательная функция проекта, подтверждённая Figma и существующим frontend. Поля `scheduled` и `publishedAt` сохраняются в frontend/domain и backend contract.

| Frontend | WordPress `post_status` | Правило |
| --- | --- | --- |
| `draft` | `draft` | Публикация не происходит независимо от переданного `publishedAt`; дата публикации очищается/игнорируется |
| `scheduled` | `future` | `publishedAt` обязателен; `post_date`/`post_date_gmt` содержат будущую дату |
| `published` | `publish` | Публикуется сразу и попадает в следующий public snapshot |

Интерпретация UI:

- `status=draft` — сохранить WordPress draft, не планировать публикацию;
- `status=published` и `publishMode=now` — frontend/domain request содержит `status=published`, backend сохраняет `post_status=publish`;
- `status=published` и `publishMode=scheduled` — frontend преобразует состояние формы в domain request `status=scheduled` с обязательным `publishedAt`, backend сохраняет `post_status=future`.

`publishMode` является только состоянием staff-формы. Его не нужно добавлять в `Hero`, REST DTO, post meta или другое WordPress storage.

Для `scheduled` frontend передаёт ISO-8601 datetime. Backend обязан независимо:

1. Проверить ISO-8601 date-time format. Текущий frontend передаёт локальные компоненты даты и времени без browser timezone conversion.
2. Интерпретировать эти компоненты только в timezone WordPress site (`wp_timezone()`), которая является источником истины; PHP/server/browser default timezone не использовать.
3. Проверить по server time, что момент строго находится в будущем.
4. Корректно заполнить local `post_date` и UTC `post_date_gmt`.
5. Передать `post_status=future` штатному WordPress post API.

Пустой, некорректный или не будущий `publishedAt` для `scheduled` возвращает validation error `422` и не создаёт/не изменяет запись частично.

Используется штатный механизм WordPress scheduled publication, включая переход `future → publish` и core hook `publish_future_post`; собственный параллельный scheduler не создаётся. После фактического перехода в `publish` plugin синхронно инициирует rebuild public snapshot и увеличение content version. До этого момента hero отсутствует в public snapshot и не открывается через `/screen/heroes/:id`.

Для production рекомендуется не полагаться только на traffic-driven WP-Cron. Если публикация должна происходить своевременно, `wp-cron.php` следует запускать системным cron scheduler с согласованным интервалом.

## 5. Mapping Hero

REST DTO использует `snake_case`; WordPress adapter преобразует его в существующий camelCase domain model.

| Frontend field | WordPress storage | REST field | Validation / sanitization |
| --- | --- | --- | --- |
| `id` | `WP_Post::ID` | `id` | Read-only, положительный integer через `absint` |
| `firstName` | post meta `_museum_first_name` | `first_name` | Обязательная непустая строка, `sanitize_text_field`, trim, ограничение длины |
| `lastName` | post meta `_museum_last_name` | `last_name` | Обязательная непустая строка, `sanitize_text_field`, trim, ограничение длины |
| `middleName` | post meta `_museum_middle_name` | `middle_name` | Nullable/optional, `sanitize_text_field`, trim, пустая строка превращается в `null` |
| `districtId` | единственный term relationship `museum_district` | `district_id` | Обязательный `absint`; term существует в нужной taxonomy; пользователь может назначать районы |
| `birthDate` | post meta `_museum_birth_date` | `birth_date` | Nullable ISO date `YYYY-MM-DD`; строгая calendar validation, а не только regex |
| `deathDate` | post meta `_museum_death_date` | `death_date` | Nullable ISO date; не раньше `birth_date` |
| `mainImage` | стандартный featured image `_thumbnail_id` | `main_image` | На write принимается attachment ID; attachment существует, `post_type=attachment`, MIME начинается с `image/` |
| `biography` | post meta `_museum_biography` | `biography` | Nullable plain text, `sanitize_textarea_field`, сохранять переносы строк; HTML запрещён |
| `feat` | post meta `_museum_feat` | `feat` | То же правило, что для biography |
| `awards` | post meta `_museum_awards` | `awards` | То же правило, что для biography |
| `gallery` | post meta `_museum_gallery_ids` — ordered array attachment IDs | `gallery` | Массив уникальных `absint`, каждый ID является image attachment, порядок сохраняется |
| `status` | `post_status` | `status` | Только `draft`, `scheduled`, `published`; публикация требует capability `publish_museum_heroes` |
| `publishedAt` | `post_date` и `post_date_gmt` для `future`/`publish` | `published_at` | Обязательно для `scheduled`; ISO-8601 date-time; local request components интерпретируются в WordPress site timezone; момент строго в будущем; response возвращает явный offset |

`post_title` вычисляется как `lastName firstName middleName` после validation. Он не добавляется в Hero DTO.

Meta необходимо регистрировать через `register_post_meta()` с точными schema, `single`, sanitize callback и auth callback. Нельзя массово принимать произвольный объект meta из request.

`biography`, `feat` и `awards` в первой версии являются только plain text. Rich text, HTML и произвольная разметка не реализуются.

### Write DTO

`POST`/`PUT` принимают скалярные поля Hero и ссылки на media как IDs:

```json
{
  "first_name": "Иван",
  "last_name": "Иванов",
  "middle_name": "Иванович",
  "district_id": 12,
  "birth_date": "1918-03-14",
  "death_date": "1944-08-02",
  "main_image_id": 301,
  "biography": "...",
  "feat": "...",
  "awards": "...",
  "gallery_ids": [302, 303],
  "status": "scheduled",
  "published_at": "2026-09-20T12:00:00"
}
```

Read DTO разворачивает `main_image` и `gallery` в `MediaDto`, чтобы frontend не делал N+1 requests.

`publishMode` отсутствует в Write DTO намеренно. Frontend преобразует комбинацию `status=published + publishMode=scheduled` в показанные выше `status=scheduled + published_at` до вызова repository.

## 6. Mapping District, MediaFile и User

### District

| Frontend field | WordPress storage | REST field | Validation / sanitization |
| --- | --- | --- | --- |
| `id` | `term_id` | `id` | Read-only positive integer |
| `name` | `WP_Term::name` | `name` | Required, `sanitize_text_field`, non-empty |
| `slug` | `WP_Term::slug` | `slug` | Required or server-generated; `sanitize_title`; unique in taxonomy |
| `sortOrder` | term meta `museum_sort_order` | `sort_order` | Nullable integer, `intval`; default based on current maximum + step |

### MediaFile

| Frontend field | WordPress storage/source | REST field | Validation / transformation |
| --- | --- | --- | --- |
| `id` | attachment ID | `id` | Read-only positive integer |
| `url` | `wp_get_attachment_image_url()` for staff/full display size | `url` | Absolute same-origin HTTPS URL preferred |
| `thumbnailUrl` | registered optimized screen image size | `thumbnail_url` | Public snapshot must prefer optimized derivative, not original archive file |
| `name` | attachment title or sanitized original filename | `name` | `sanitize_text_field` on upload |
| `width` | attachment metadata | `width` | Read-only non-negative integer |
| `height` | attachment metadata | `height` | Read-only non-negative integer |

Upload использует WordPress media APIs (`media_handle_upload`, attachment metadata generation), MIME allowlist и server-side limits. SVG upload не разрешается автоматически: это отдельное security-решение.

Attachment, указанный как main image или входящий в gallery любого героя независимо от его статуса, удалять запрещено. REST возвращает HTTP `409` с code `media_in_use`. Проверка выполняется по актуальному WordPress state непосредственно перед удалением.

### User

| Frontend field | WordPress source | REST field | Правило |
| --- | --- | --- | --- |
| `id` | `WP_User::ID` | `id` | Read-only |
| `username` | `user_login` | `username` | Возвращать только самому authenticated user |
| `displayName` | `display_name` | `display_name` | `sanitize_text_field` при отображении |
| `email` | `user_email` | `email` | Только authenticated response; не public |
| `role` | WordPress roles/capabilities | `role` | `administrator` → `administrator`, `museum_editor` → `editor` |

Отдельная таблица пользователей и JWT claims не создаются.

## 7. Roles и capabilities

При activation plugin создаёт роль `museum_editor`; при upgrade синхронизирует capabilities. Administrator получает тот же набор plugin capabilities. Удалять роль и перепривязывать пользователей при обычной деактивации не следует.

Базовый набор для `museum_editor`:

- `read`;
- `upload_files`;
- `read_museum_hero`;
- `edit_museum_hero`;
- `delete_museum_hero`;
- `edit_museum_heroes`;
- `edit_others_museum_heroes`;
- `edit_private_museum_heroes`;
- `edit_published_museum_heroes`;
- `publish_museum_heroes`;
- `read_private_museum_heroes`;
- `delete_museum_heroes`;
- `delete_private_museum_heroes`;
- `delete_published_museum_heroes`;
- `delete_others_museum_heroes`;
- `manage_museum_districts`;
- `edit_museum_districts`;
- `delete_museum_districts`;
- `assign_museum_districts`;
- custom `delete_museum_media`, если editor должен удалять attachments через приложение.

Роль не получает управление plugins, themes, options, произвольными posts/pages или пользователями. Создание пользователей остаётся задачей administrator.

`museum_editor` может редактировать, публиковать, переносить в Trash и восстанавливать всех `museum_hero` независимо от автора. Именно поэтому роль получает `edit_others_museum_heroes` и `delete_others_museum_heroes`. Никакие administrator capabilities роли не выдаются.

## 8. REST API

Namespace: `/wp-json/museum/v1`.

Все responses имеют JSON content type. Ошибки возвращаются как `WP_Error` с устойчивым machine-readable code, человекочитаемым `message` и правильным HTTP status. Frontend adapter преобразует их в `ApiError`/`AuthError`.

### 8.1 Heroes: authenticated staff

| Method | Route | Назначение | Permission callback |
| --- | --- | --- | --- |
| `GET` | `/heroes` | Пагинированный staff list | `current_user_can('edit_museum_heroes')` |
| `POST` | `/heroes` | Создание | `current_user_can('edit_museum_heroes')`; publish проверяется отдельно |
| `GET` | `/heroes/{id}` | Staff detail | post существует и `current_user_can('edit_post', id)` |
| `PUT/PATCH` | `/heroes/{id}` | Полное/частичное обновление | `current_user_can('edit_post', id)` плюс publish capability |
| `DELETE` | `/heroes/{id}` | Перемещение в WordPress Trash | `current_user_can('delete_post', id)` |

Query `/heroes`:

- `page`: positive integer, default `1`;
- `per_page`: positive integer, default `10`, server cap рекомендуется `100`;
- `search`: sanitized text;
- `district_id`: valid term ID;
- `status`: `draft|scheduled|published`, mapped to WP statuses;
- `order`: `asc|desc`, сортировка по фамилии, имени и ID.

Response:

```json
{
  "items": [],
  "page": 1,
  "per_page": 10,
  "total": 0,
  "total_pages": 0
}
```

Поиск должен учитывать обе формы полного имени, как текущий mock: `фамилия имя отчество` и `имя отчество фамилия`. Рекомендуется поддерживать производное internal meta `_museum_search_text`, пересчитываемое plugin из обеих форм имени и нормализованное для поиска. Оно не является новым domain field и не принимается от клиента. Для первой версии допустим `WP_Query` с контролируемым meta search; при большом объёме нужно отдельно оценить индексируемость, не переходя автоматически к прямому SQL.

`HeroesRepository.delete(id)` означает вызов `wp_trash_post()`. Custom REST не предоставляет `force=true` и не выполняет hard delete. После перемещения опубликованного героя в Trash public snapshot перестраивается. Hard delete в штатном React `/staff` UX не требуется.

### 8.2 Districts: authenticated staff

| Method | Route | Permission callback |
| --- | --- | --- |
| `GET` | `/districts` | `current_user_can('edit_museum_heroes')` |
| `POST` | `/districts` | `current_user_can('manage_museum_districts')` |
| `GET` | `/districts/{id}` | `current_user_can('edit_museum_heroes')` |
| `PUT/PATCH` | `/districts/{id}` | `current_user_can('edit_museum_districts')` |
| `DELETE` | `/districts/{id}` | `current_user_can('delete_museum_districts')` |

Delete сначала проверяет актуальные relationships для всех hero statuses. При наличии героя возвращается `409 district_in_use`. Slug conflict возвращает `422 district_slug_conflict`.

### 8.3 Media: authenticated staff

Frontend contract требует дополнительные routes:

| Method | Route | Permission callback |
| --- | --- | --- |
| `GET` | `/media` | `current_user_can('upload_files')` |
| `POST` | `/media` | `current_user_can('upload_files')` |
| `DELETE` | `/media/{id}` | `current_user_can('delete_museum_media')` и `current_user_can('delete_post', id)` |

Upload — `multipart/form-data`; response — `MediaDto`. List должен быть ограничен image attachments и иметь согласованную pagination strategy. Текущий frontend ожидает `getAll()`, поэтому предел библиотеки media является открытым вопросом из раздела 15.

### 8.4 Public screen

| Method | Route | Permission callback |
| --- | --- | --- |
| `GET` | `/screen` | `__return_true` |
| `GET` | `/screen/version` | `__return_true` |

`GET /screen` возвращает:

```json
{
  "version": 42,
  "districts": [],
  "heroes": [],
  "generated_at": "2026-09-08T13:00:00Z"
}
```

В snapshot входят только `post_status=publish` и только публичные поля. `status`, `published_at`, user data, internal meta и original archive URLs исключаются. При этом включаются все terms taxonomy `museum_district`, включая районы без опубликованных героев; это утверждённое поведение первой версии и соответствует текущему frontend snapshot.

`GET /screen/version` возвращает только:

```json
{ "version": 42 }
```

Cache headers должны допускать быструю revalidation. Нельзя отдавать приватный response из shared cache. Для snapshot рекомендуется `ETag`, но числовой `version` остаётся каноническим frontend-контрактом.

### 8.5 Auth

| Method | Route | Permission callback |
| --- | --- | --- |
| `POST` | `/auth/login` | Public callback; handler проверяет same-origin Origin/Referer и credentials |
| `POST` | `/auth/logout` | Authenticated WordPress user + valid REST nonce |
| `GET` | `/auth/me` | Authenticated WordPress user + valid REST nonce |

`POST /auth/login` body:

```json
{
  "login": "editor",
  "password": "...",
  "remember": true
}
```

Handler использует `wp_signon()` и WordPress cookie. `remember=true` передаётся в штатный WordPress remember flow; frontend не хранит пароль или token. Успешный response содержит domain-compatible user DTO и новый REST nonce:

```json
{
  "user": {
    "id": 10,
    "username": "editor",
    "display_name": "Редактор музея",
    "email": "editor@example.org",
    "role": "editor"
  },
  "nonce": "..."
}
```

Для login endpoint нужны HTTPS, проверка same-origin headers, стандартная защита WordPress от brute force либо явно выбранный rate limiter. CORS с wildcard и cross-origin credential login запрещены.

Основной staff UX сохраняет собственный React route `/staff/login`, который вызывает custom `POST /wp-json/museum/v1/auth/login`. `wp-login.php` не является основным маршрутом входа сотрудников, но остаётся доступен administrator для штатного управления WordPress. Auth использует только same-origin WordPress cookies и `X-WP-Nonce`; JWT запрещён.

## 9. Authentication flow

Используется только same-origin WordPress cookie authentication:

1. WordPress shell помещает начальный `wp_rest` nonce в runtime bootstrap перед React entry.
2. Frontend WordPress client выполняет authenticated requests с `credentials: 'include'`.
3. Nonce передаётся в `X-WP-Nonce`.
4. REST cookie validation устанавливает текущего `WP_User`.
5. Каждый controller повторно проверяет capability в `permission_callback`.
6. При `401/403` из-за истёкшего nonce клиент получает новый nonce через разрешённый same-origin flow либо возвращает пользователя на login.
7. Logout вызывает `/auth/logout`, затем очищает только frontend auth state; WordPress очищает cookie.

Пример будущего transport:

```ts
fetch(url, {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': runtimeConfig.nonce,
  },
});
```

Nonce — runtime value, не `VITE_*` secret. JWT, Bearer token и token storage в localStorage/IndexedDB не используются.

## 10. Public snapshot и content version

Чтобы `/screen/version` и `/screen` не описывали разные состояния, первая версия хранит материализованный snapshot как единый versioned artifact в non-autoloaded WordPress option:

```text
museum_screen_snapshot = {
  version,
  generated_at,
  districts,
  heroes
}
```

Source of truth остаются CPT, taxonomy и attachments. Option содержит только rebuildable public projection, не является отдельным хранилищем heroes и может быть полностью восстановлен из WordPress entities.

Алгоритм публикации snapshot:

1. Relevant mutation успешно завершает запись WordPress entities.
2. Plugin строит полный новый public projection во временной структуре.
3. Выполняются validation и сериализация всего projection.
4. Версия увеличивается монотонно.
5. Новый `{version, generated_at, districts, heroes}` заменяет активный artifact одной операцией `update_option(..., autoload=false)`.
6. При ошибке построения предыдущий artifact и version остаются активными.

Оба public endpoints читают один artifact. Это соответствует frontend IndexedDB-модели «сохранить полностью, затем активировать».

Snapshot перестраивается после:

- создания/изменения/удаления опубликованного героя;
- перехода `draft/future ↔ publish`;
- выполнения scheduled publication;
- изменения/удаления публичного district или его порядка;
- изменения attachment metadata/file, если attachment используется опубликованным героем.

Редактирование draft, не меняющее текущую публичную проекцию, не обязано увеличивать public version. Перестроение должно быть защищено от параллельных writers lock-механизмом на уровне WordPress API; прямые SQL transactions для первой реализации не требуются.

Если artifact отсутствует после установки, первый `/screen` строит его контролируемо. Если rebuild невозможен, endpoint возвращает предыдущий snapshot; удалять последнюю рабочую версию нельзя.

## 11. DTO → domain mapping во frontend adapter

WordPress adapters размещаются отдельно от UI, например:

```text
src/wordpress/
├── client/
├── dto/
├── mappers/
└── repositories/
```

Обязательные преобразования:

- `first_name → firstName`;
- `last_name → lastName`;
- `middle_name: null → middleName: undefined`;
- `district_id → districtId`;
- `birth_date/death_date → birthDate/deathDate`;
- `main_image → mainImage`;
- `thumbnail_url → thumbnailUrl`;
- `sort_order → sortOrder`;
- `published_at → publishedAt`;
- `generated_at → generatedAt`;
- `per_page/total_pages → perPage/totalPages`;
- WordPress `draft/future/publish → draft/scheduled/published`;
- WordPress role `museum_editor → editor`.

Mapper обязан проверять response shape и не маскировать malformed DTO как пустые данные. Tests размещаются в уже зарезервированном `tests/unit/mappers/`.

## 12. React build integration

Vite создаёт `dist/manifest.json`. SPA mount и build assets являются независимыми URL. Пример production configuration:

```text
VITE_DATA_SOURCE=wordpress
VITE_APP_BASE_PATH=/book-of-remembrance
VITE_ASSET_BASE=/wp-content/plugins/museum-core/public/build/
VITE_API_BASE_URL=/wp-json/museum/v1
```

`APP_BASE_PATH` — архитектурное имя mount path; в текущей frontend configuration ему соответствует `VITE_APP_BASE_PATH`. Он используется для React basename, SPA routes и service-worker scope. `VITE_ASSET_BASE` используется только для Vite JS, CSS, fonts, icons и прочих build assets.

PHP integration:

1. Читает manifest с filesystem plugin, а не по HTTP.
2. Находит entry `index.html` и его hashed `file`.
3. Подключает module script через `wp_enqueue_script_module()` на поддерживаемой версии WordPress либо безопасный module-tag fallback.
4. Подключает каждый manifest CSS entry через `wp_enqueue_style()`.
5. Не хардкодит hashed filenames.
6. Не подключает приложение на несвязанных WordPress pages.
7. До entry выводит безопасно сериализованный runtime config с REST base URL и nonce.

Mount point:

```html
<div id="root" class="book-of-remembrance-root"></div>
```

WordPress template для `/screen` должен сохранять fullscreen layout и не добавлять theme chrome/margins. Общие frontend styles уже ограничены `.book-of-remembrance-root`, но host theme не должна перекрывать приложение глобальными `!important` rules.

### Assets и service worker

Утверждённое разделение URL:

```text
APP_BASE_PATH=/book-of-remembrance
Service worker URL=/book-of-remembrance/sw.js
Service worker scope=/book-of-remembrance/
Vite assets=/wp-content/plugins/museum-core/public/build/assets/...
```

Искусственный rewrite `/book-of-remembrance/assets/*` не требуется. JS, CSS, fonts, icons и static UI assets могут обслуживаться непосредственно из публичного plugin build URL.

Перед WordPress integration потребуется минимальное изменение frontend architecture:

1. Service-worker URL и registration `scope` вычисляются из `APP_BASE_PATH`/`VITE_APP_BASE_PATH`, а не из `import.meta.env.BASE_URL`/`VITE_ASSET_BASE`.
2. Генератор `sw.js` встраивает отдельный asset base и строит `PRECACHE_URLS` относительно `VITE_ASSET_BASE`, а не относительно `self.registration.scope`.
3. Navigation fallback применяется только к `${APP_BASE_PATH}/screen` и вложенным screen routes.
4. Offline shell берётся из статического build artifact без user-specific runtime config и nonce. Персональный nonce нельзя сохранять как общий app shell.
5. Plugin отдаёт с `/book-of-remembrance/sw.js` сгенерированный build-файл с корректным JavaScript MIME type. Поскольку script расположен внутри требуемого scope, расширяющий `Service-Worker-Allowed` header не нужен.

Это изменение откладывается до frontend integration stage; в текущей задаче frontend-код не меняется.

## 13. SPA rewrite/fallback

WordPress rewrite должен направлять на React shell:

- `{base}/screen` и вложенные routes;
- `{base}/staff`, `{base}/staff/login` и вложенные routes.

Из fallback исключаются:

- `{base}/sw.js`;
- `/wp-content/plugins/museum-core/public/build/*` или фактический plugin build URL;
- `/wp-json/*`;
- `/wp-admin/*`, `/wp-login.php`;
- существующие static files.

Отдельный точный rule обслуживает `{base}/sw.js`; он не должен попадать в HTML fallback. Rewrite для `{base}/assets/*` не создаётся, если assets доступны из plugin build URL.

SPA rewrite rules регистрируются при plugin init, а `flush_rewrite_rules()` вызывается только при activation/deactivation или контролируемом изменении base path, не на каждом request. Прямой reload `/book-of-remembrance/screen/heroes/123` должен возвращать тот же shell; hero availability затем определяется только public snapshot.

## 14. Security requirements

- Все input параметры имеют REST schema, sanitize и validate callbacks.
- Все staff routes используют реальные `permission_callback`; `__return_true` допустим только для public screen и login.
- Object-level authorization проверяется через `current_user_can()` для конкретного post/attachment.
- Public snapshot строится server-side только из `publish`; frontend-фильтр не является security boundary.
- Raw `museum_hero` не публикуется через core REST.
- Пароли не логируются и не возвращаются.
- Ответы auth routes используют `Cache-Control: no-store`.
- Same-origin cookies не заменяются JWT.
- REST nonce защищает authenticated cookie requests от CSRF, но не заменяет capability checks.
- Media upload проверяет MIME по фактическому файлу, размер и разрешение.
- Ошибки production не раскрывают filesystem paths, SQL или stack traces.

### Data retention

Деактивация и удаление plugin не удаляют `museum_hero`, `museum_district`, attachments, WordPress users или их содержимое. Plugin не реализует автоматический destructive cleanup и не выполняет cascade delete media при удалении героя.

`uninstall.php` с удалением музейного контента не создаётся. Если administrator когда-либо потребуется полная очистка, это должна быть отдельная явно подтверждаемая административная процедура вне штатной deactivate/uninstall операции.

## 15. Оставшиеся вопросы и степень блокировки

Утверждённых решений достаточно, чтобы начать реализацию plugin structure, CPT/taxonomy, capabilities, DTO/mappers, REST controllers, auth flow и snapshot projection. Полностью блокирующих старт backend-разработки вопросов больше нет.

До завершения production-ready реализации необходимо уточнить:

| Вопрос | Что блокирует |
| --- | --- |
| Минимальная поддерживаемая версия WordPress | Выбор `wp_enqueue_script_module()` или совместимого fallback |
| Ожидаемый размер медиатеки | Окончательный контракт pagination: сбор server pages в adapter или будущий paged frontend repository |
| Лимиты данных и upload | Точные REST schema limits: длины имён/текстов, gallery count, file size, dimensions и MIME allowlist |
| Размеры optimized media | Регистрацию WordPress image sizes и окончательный `thumbnail_url` для screen/offline cache |
| Auth rate limiting | Конкретную защиту custom `/auth/login`: hosting/WAF/security plugin или throttling в `museum-core` |
| Ожидаемое число героев и search profile | Подтверждение `WP_Query` по `_museum_search_text` либо выбор более масштабируемой индексируемой strategy |

Эти вопросы не мешают начать реализацию, но соответствующие части нельзя считать production-ready до получения ответов. Остальные ранее спорные решения зафиксированы: обязательная scheduled publication в timezone сайта с рекомендацией системного cron, собственный React login, права editor на всех museum heroes, media conflict, plain text, все districts в snapshot, WordPress Trash, безопасный uninstall, materialized option snapshot и независимые APP/asset bases.
