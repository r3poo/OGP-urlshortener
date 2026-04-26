## Simple URL Shortener
A URL shortener built with React on the Bun runtinme that can be served via a public IP or behind a reverse proxy passing proxy headers.

### Configuration
Application uses a postgresql backend to store redirect routes. If using Supabase, select `Transaction pooler` when connecting.

Create .env file with the following variables:
```
PG_URI: postgres connection uri (postgresql://...)
PORT: override port binding (defaults to 80)
HOST: overrive public hostname
```

### Deployment

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
bun dev
```

To run for production:

```bash
bun start
```

To run persistently:

```
bun install -g pm2
pm2 start --name url "bun --watch ./src/index.ts"
```

### Demo
Available at:\
[us.r3po.org/admin](https://us.r3po.org) (Singapore only)\
[ogp-urlshortener.onrender.com/admin](https://ogp-urlshortener.onrender.com/admin) (Inernational)