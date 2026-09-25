# Sources and verification

- Official announcement: https://www.postgresql.org/about/news/pgadmin-4-v918-released-3381/
- Posted by: pgAdmin Development Team
- Source and event date: 2026-09-17 (`date_only`)
- Stage: stable release; Windows and macOS builds, Python wheel, Docker container, RPM, DEB and source archive are available.
- Checked at: 2026-09-17T16:32:20.0783973-03:00

## Claims used

- pgAdmin 4 v9.18 includes fixes for four security vulnerabilities, CVE-2026-86861 through CVE-2026-86864.
- CVE-2026-86863 fixes an authentication bypass in Webserver authentication mode caused by falling back to a client-controlled request header for identity.
- The default Content Security Policy now uses a per-request nonce for inline scripts, removes blanket `unsafe-inline` for scripts and drops `unsafe-eval` outside debug development bundles.
- The Object Explorer can be collapsed or restored from the current workspace icon or with the default `Ctrl+Alt+B` shortcut.

No claim of active exploitation or severity rating is made because the announcement does not provide either.
