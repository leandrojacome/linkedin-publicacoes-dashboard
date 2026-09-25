# claude-code-v2-1-274-2026-09-17

- **Estado:** published_confirmed
- **Produto:** Claude Code
- **Evento:** Claude Code v2.1.274 release with MCP reliability, memory-pressure warnings, and telemetry improvements
- **Versão:** 2.1.274
- **Fonte principal:** https://github.com/anthropics/claude-code/releases/tag/v2.1.274
- **Data do evento:** 2026-09-17
- **Alvo reservado:** 2026-09-18T07:00:00-03:00
- **Link da publicação:** https://www.linkedin.com/feed/update/urn:li:activity:7506734663135162368/
- **Envio tentado:** —

## Capas

- [cover.png](cover.png) — C2PA/caBX: sim; capa selecionada no registro

## Texto preparado

Claude Code v2.1.274 sharpens MCP reliability: long-running Streamable HTTP tool calls now honor per-server timeouts, while legacy HTTP+SSE servers can fall back correctly. The release also adds clearer memory-pressure warnings and richer telemetry.

https://github.com/anthropics/claude-code/releases/tag/v2.1.274

#ClaudeCode #MCP #DeveloperTools

## Fontes e notas

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
