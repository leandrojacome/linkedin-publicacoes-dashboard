# Docker Sandbox Kit Spec — evidence and selection

- Official announcement: https://www.docker.com/blog/docker-sandbox-kit-spec-cncf/ — posted September 24, 2026. Docker says the open Sandbox Kit Spec is based on OCI images and carries the agent, its tools, and typed requests for hosts, credentials, and volumes. It says it is bringing the spec to CNCF under neutral governance. This is an announced proposal, not a finalized CNCF standard.
- Official technical explanation: https://www.docker.com/blog/docker-sandbox-kit-spec/ — posted September 24, 2026. Describes the specification and access grants in the OCI image.
- Official repository: https://github.com/docker/sandbox-kit-spec — technical implementation reference.
- X research: searches for official September 24 posts from Docker, CNCF, OpenAI and Anthropic did not return a verifiable primary X post in the search index. The item is sourced to Docker's official announcement; no claim is based on an unverified X result.

## Time and precision

The official Docker page displays only the date in the visible article, but its `datePublished` structured data says `2026-09-24T09:00:00-07:00`, or 16:00 UTC / 13:00 São Paulo. The article is within the requested 12-hour window at the September 24 22:04 UTC selection check and the 20:00 São Paulo target. `dateModified` is `2026-09-24T09:00:12-07:00`. Revalidate source content and timing at posting.

## Editorial choice

The announcement directly affects AI-agent developers: access requests become a versioned artifact that can be reviewed, signed and enforced by conforming runtimes. It is more relevant to Leandro's engineering audience than a single-vendor marketing case study. The image presents the proposal as a concept, avoiding a claim that standardization is complete.
