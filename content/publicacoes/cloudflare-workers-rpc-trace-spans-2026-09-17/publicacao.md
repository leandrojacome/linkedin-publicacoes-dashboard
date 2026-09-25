# cloudflare-workers-rpc-trace-spans-2026-09-17

- **Estado:** published_confirmed
- **Produto:** Cloudflare Workers
- **Evento:** automatic JavaScript RPC session spans in Workers traces
- **Versão:** —
- **Fonte principal:** https://developers.cloudflare.com/changelog/post/2026-09-17-javascript-rpc-session-spans/
- **Data do evento:** 2026-09-17
- **Alvo reservado:** 2026-09-17T18:00:00-03:00
- **Link da publicação:** https://www.linkedin.com/feed/update/urn:li:activity:7506457011904094209/
- **Envio tentado:** —

## Capas

- [cover.png](cover.png) — C2PA/caBX: sim; capa selecionada no registro

## Texto preparado

Cloudflare Workers tracing now follows JavaScript RPC calls across Worker boundaries and into Durable Objects.

The dashboard shows caller sessions and method calls alongside callee invocations, nested calls, and callbacks. Enable tracing in Wrangler; Cloudflare records the spans automatically, with no application code changes or observability SDK required.

Changelog:
https://developers.cloudflare.com/changelog/post/2026-09-17-javascript-rpc-session-spans/

#Cloudflare #Observability #Serverless

## Fontes e notas

# Sources

- Official Cloudflare changelog: https://developers.cloudflare.com/changelog/post/2026-09-17-javascript-rpc-session-spans/
  - Source and event date: 2026-09-17 (`date_only`).
  - Stage: available in Workers tracing.
  - Verified at: 2026-09-17T15:31:49.0046367-03:00.
  - Evidence: traces follow JavaScript RPC calls across Worker boundaries and into Durable Objects; the dashboard shows caller-side sessions and method calls with callee invocations, nested calls, and callbacks.
  - Setup: enable traces in Wrangler. Cloudflare records the spans automatically without application code changes or an observability SDK.
  - Practical relevance: distributed RPC latency and session reuse become visible in one trace.
