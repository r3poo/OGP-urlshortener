# Simple URL Shortener
A URL shortener built with React on the Bun runtime that can be served via a public IP or behind a reverse proxy passing proxy headers. Console acccessible from /admin path

## Configuration
Application uses a postgresql backend to store redirect routes. If using Supabase, select `Session pooler` when connecting.

Create table with following schema:
| Name | Type | Default Value | Primary | Unique |
|------|------|------|------|------|
| id | int8 |  | :o: | :o: | 
| created_at | timestampz | now() | :x: | :x: |
| alias_path | text | "" | :x: | :o: | 
| dest | text | "" | :x: | :x: |


Create .env file with the following variables:
```
# postgres connection uri (postgresql://...)
PG_URI= #required

# name of table to use in postgresql
DB_NAME= #required

# ttl in days for shortened url entries
PUBLIC_LINK_TTL= #required

# port binding (defaults to 80)
PORT= #optional

# override public hostname (defaults to auto-detection)
HOST= #optional

# path to console (defaults to /admin)
CONSOLE= #optional

# path for shortened urls (defaults to /url, cannot be root /)
PUBLIC_SHORTENED= #optional

# token to access api directly, see api section in readme
PRIV_TOKEN= #optional

```

## Deployment

To install Bun runtime:
```bash
npm install -g bun
```

To install dependencies:
```bash
bun install
```

To start a development server:
```bash
bun run dev
```

To build frontend:
```bash
bun run buid
```

To run for production:
```bash
bun run start
```

To build then run for production:
```bash
bun run serve
```


To run persistently:

```
bun install -g pm2
pm2 start --name url "bun run serve"

### To Stop ###
pm2 stop url
```

## Demo
Available at:\
[us.r3po.org/admin](https://us.r3po.org/admin) (Singapore only)\
[ogp-urlshortener.onrender.com/admin](https://ogp-urlshortener.onrender.com/admin) (Inernational)


## API

Base behavior is implemented in `src/server/api/v1/api.ts` and database operations in `src/server/db.ts`.

### Authentication

- `POST /api/v1/register` and `POST /api/v1/lookup` require a `session_token` cookie.
- Visit the console page (`CONSOLE`, default `/admin`) to receive a fresh session cookie.
- `PRIV_TOKEN` (if set) is also accepted as a valid `session_token` value.

### Alias format

- `alias_path` is stripped of leading/trailing `/` before use.
- Allowed characters are matched by:
`^[a-zA-Z0-9._~!$&'()*+,;=:@%-]+$`

### Endpoints

### `POST /api/v1/register`

Create a new short alias.

Request body (`application/json`):
```json
{
  "alias_path": "my-link",
  "dest": "https://example.com"
}
```

Responses (`text/plain`):
- `200`: returns full shortened URL (example: `https://host/my-link` or `https://host/<SHORTENED>/my-link`)
- `400`: `Bad Request` (missing fields or invalid alias)
- `401`: `Unauthorized`
- `409`: `Alias already exists`
- `500`: `Internal Server Error`

Notes:
- Alias uniqueness is enforced by `alias_path` in the database.
- Existing aliases are not overwritten by this endpoint (it returns `409` first).

### `POST /api/v1/lookup`

Reverse lookup: find all aliases that point to a destination URL.

Request body (`application/json`):
```json
{
  "dest": "https://example.com"
}
```

Responses (`text/plain`):
- `200`: comma-separated list of full URLs
- `401`: `Unauthorized`
- `404`: `No associated alias`

### `GET /:path` (or `GET /<ENV.SHORTENED>/:path`)

Resolve an alias and redirect.

Responses:
- `302`: redirect with `Location` header set to stored `dest`
- `400`: `Invalid shortened path`
- `404`: `Alias does not exist`


### Example usage with curl
```bash
curl -b "session_token=<PRIV_KEY>" \
    -X POST \
    -d '{"dest": "https://ftp.debian.org"}' \
    -H "Content-Type: application/json" \
    https://yourdomain.org/api/v1/lookup

curl -b "session_token=<PRIV_KEY>" \
    -X POST \
    -d '{"alias_path": "123", "dest": "https://ftp.debian.org"}' \
    -H "Content-Type: application/json" \
    https://yourdomain.org/api/v1/register
```


## Miscellaneous

### Hostname and URL construction

When generating full URLs, host is determined in this order:
1. `HOST` environment variable (if set)
2. Reverse proxy headers `X-Forwarded-Proto` + `X-Forwarded-Host`
3. Request URL protocol + host

### Database behavior

The table configured by `DB_NAME` is used for all API operations:

- `get_dest(alias_path)`: fetch destination URL for redirects
- `get_alias(host, dest)`: fetch all matching aliases and return full URLs
- `set_alias_path(alias_path, dest)`: insert/update alias row (upsert on `alias_path`)

Maintenance job:
- cleanup is triggered every minute where rows older than configured number of days are deleted
- prepared statement are cleared from database on startup

