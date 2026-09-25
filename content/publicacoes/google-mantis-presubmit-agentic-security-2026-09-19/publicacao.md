# google-mantis-presubmit-agentic-security-2026-09-19

- **Estado:** published_confirmed
- **Produto:** Google infrastructure security workflow / Mantis
- **Evento:** technical explanation of agentic presubmit vulnerability scanning and triage
- **Versão:** —
- **Fonte principal:** https://cloud.google.com/blog/topics/systems/using-ai-agents-to-secure-google-infrastructure/
- **Data do evento:** —
- **Alvo reservado:** 2026-09-19T16:00:00-03:00
- **Link da publicação:** https://www.linkedin.com/feed/update/urn:li:activity:7507151530349989888/
- **Envio tentado:** —

## Capas

- [cover.png](cover.png) — C2PA/caBX: não; capa selecionada no registro

## Texto preparado

What if security review started with every code change?

Google describes an internal workflow where AI agents scan pre-submit changes, structural checks test whether a reported path is reachable, and fix agents propose patches for human review. Nightly post-submit scanning adds a second layer.

https://cloud.google.com/blog/topics/systems/using-ai-agents-to-secure-google-infrastructure/

#AppSec #AIEngineering #DevSecOps

## Fontes e notas

# Source verification — 2026-09-19

Official Google Cloud engineering blog: https://cloud.google.com/blog/topics/systems/using-ai-agents-to-secure-google-infrastructure/

The article itself displays **September 19, 2026** (the search index initially displayed September 18; the source page date governs). It describes Google's internal Mantis-based multi-agent security review as a technical explanation, not a newly launched public product. Pre-submit agents scan individual code changes; a specialized triage agent checks reachable vulnerable paths with structural code analysis, including AST and call graph traversal; a bug-fix agent proposes patches for human review. A nightly post-submit scan is a second layer. The post text omits the article's precision, false-positive, scale, and timing claims rather than restating them without context.

Source date: 2026-09-19; event date: not separately established; stage: technical case study, not product launch; checked: 2026-09-19 14:33 America/Sao_Paulo.
