# @ai-agg-agg/aggregator-routerai

[routerai.ru](https://routerai.ru) aggregator plugin for [`aaa`](https://github.com/ai-agg-agg/aaa).

Registers a `routerai` aggregator with `aaa`'s plugin registry via an oclif `init` hook —
no core changes required.

## Install

```sh
aaa plugins:install @ai-agg-agg/aggregator-routerai
```

or, from source:

```sh
bun add @ai-agg-agg/aggregator-routerai
```

## Configuration

| Env var | Default | Purpose |
|---|---|---|
| `ROUTERAI_API_KEY` | — | Auth token (falls back to `~/.authinfo.gpg`) |
| `ROUTERAI_API_BASE` | `https://routerai.ru/api` | API base URL |

## What it provides

Implements the `Aggregator` contract from `aaa`:

- `fetchModels()` — `GET /v1/models`, tries anonymous first, retries with `Authorization`
  bearer token on failure. Normalizes routerai's pricing shape (`pricing.prompt` /
  `pricing.completion`, per-request token, per-second currency) into `aaa`'s common
  `Model` shape, tagging `_aggregator: 'routerai.ru'`. Cached with stale-on-error fallback.
- `getBalance()` — `GET /v1/key`, reads `balance` (top-level or nested under `data`)
- `getUsage()` — not exposed by the routerai API; always returns `'0'`
- `filterModels()` — filters by agent type (claude/openai/any)

See `aaa`'s [`Aggregator` contract](https://github.com/ai-agg-agg/aaa/blob/main/src/aggregators/contract.ts)
for the full interface.

## Development

```sh
bun install
bun run build   # tsc → dist/
```

## License

MIT
