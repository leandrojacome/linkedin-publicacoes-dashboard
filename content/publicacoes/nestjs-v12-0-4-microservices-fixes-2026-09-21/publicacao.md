# nestjs-v12-0-4-microservices-fixes-2026-09-21

- **Estado:** prepared_deferred_by_user_priority
- **Produto:** NestJS
- **Evento:** maintenance release with microservices reliability fixes
- **Versão:** 12.0.4
- **Fonte principal:** https://github.com/nestjs/nest/releases/tag/v12.0.4
- **Data do evento:** 2026-09-21
- **Alvo reservado:** 2026-09-21T10:00:00-03:00
- **Link da publicação:** —
- **Envio tentado:** —

## Capas

- [cover.png](cover.png) — C2PA/caBX: não; capa selecionada no registro

## Texto preparado

NestJS 12.0.4 is out with a focused set of reliability fixes for microservice workloads.

The release lets Kafka clients retry after failed connections, fails pending RMQ and NATS requests cleanly on close, handles missing gRPC namespaces, and fixes a core hang involving sparse factory injection arrays.

https://github.com/nestjs/nest/releases/tag/v12.0.4

#NestJS #NodeJS #Microservices

## Fontes e notas

# Sources — NestJS v12.0.4

- Official release: https://github.com/nestjs/nest/releases/tag/v12.0.4
- Release date: 2026-09-21; GitHub records release at 08:03 on Sep 21.
- Stage: stable maintenance release (`v12.0.4`), not a major launch.
- Verified claims from the official notes:
  - Kafka client can retry after a failed connection.
  - Pending RMQ and NATS requests fail on client close.
  - Missing gRPC package namespace is handled gracefully.
  - Core hang involving sparse factory injection arrays is fixed.
- Practical framing: a focused reliability update for NestJS microservice workloads.
- Checked in America/Sao_Paulo on 2026-09-21.
