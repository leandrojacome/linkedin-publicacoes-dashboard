# Sources

- Official Cloudflare changelog: https://developers.cloudflare.com/changelog/post/2026-09-17-javascript-rpc-session-spans/
  - Source and event date: 2026-09-17 (`date_only`).
  - Stage: available in Workers tracing.
  - Verified at: 2026-09-17T15:31:49.0046367-03:00.
  - Evidence: traces follow JavaScript RPC calls across Worker boundaries and into Durable Objects; the dashboard shows caller-side sessions and method calls with callee invocations, nested calls, and callbacks.
  - Setup: enable traces in Wrangler. Cloudflare records the spans automatically without application code changes or an observability SDK.
  - Practical relevance: distributed RPC latency and session reuse become visible in one trace.
