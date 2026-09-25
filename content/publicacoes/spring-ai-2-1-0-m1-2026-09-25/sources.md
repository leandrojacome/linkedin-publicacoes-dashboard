# Spring AI 2.1.0-M1 — source check

- Official announcement: https://spring.io/blog/2026/09/25/spring-ai-2-1-0-M1-available-now/; displayed publication date September 25, 2026 (date-only on the page).
- Official GitHub release: https://github.com/spring-projects/spring-ai/releases/tag/v2.1.0-M1; API `published_at` = `2026-09-25T07:28:53Z` = 04:28:53 America/Sao_Paulo. `prerelease=true`. `created_at` was September 24 and is not the publication event.
- Announcement states the milestone builds against Spring Boot 4.2.0-M2 and adds ordered message parts, `OpenAiResponsesChatModel`, and `VectorStore.upsert` for pre-computed embeddings. Supported upsert stores in this milestone: pgvector, Redis, Elasticsearch and Qdrant. Other stores may throw until support is added.
- These are milestone APIs, not GA. The blog states they may change before GA. The message-parts native provider is initially OpenAI Responses; other model implementations are planned for RC1.
- The short post deliberately avoids unsupported claims of performance, personal experience or general availability.
