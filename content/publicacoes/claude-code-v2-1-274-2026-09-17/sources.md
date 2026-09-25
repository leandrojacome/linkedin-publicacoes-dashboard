# Sources

- Official release: https://github.com/anthropics/claude-code/releases/tag/v2.1.274
- Source date: 2026-09-17 (release page shows 17 Sep at 00:12)
- Stage: released version 2.1.274
- Checked: 2026-09-17T21:33:28.2504989-03:00

## Claims used

- Streamable HTTP MCP tool calls now respect longer per-server timeout settings instead of timing out after roughly five minutes.
- MCP servers using legacy HTTP+SSE can fall back correctly when the initial HTTP request is not accepted.
- The release adds a visible warning for critical memory usage.
- The release adds or extends OpenTelemetry data for effort and managed-settings resolution.

## Editorial note

This is a developer-tool release. The post describes concrete reliability and observability changes and does not present it as a new model or general-availability platform launch.
