# npm stage-only tokens — source verification

- Official source: https://github.blog/changelog/2026-09-18-stage-only-npm-tokens-for-safer-automation/
- Official GitHub Changelog RSS: https://github.blog/changelog/feed/ — `pubDate: Fri, 18 Sep 2026 16:37:50 +0000` (13:37:50 America/Sao_Paulo). This was within 12 hours of the user's request at approximately 01:34 local on 19 September.
- Event/source date: 18 September 2026. The source calls this an opt-in improvement, not a breach or incident.
- The announcement says granular tokens can use “Read and write (stage only)”; workflows submit with `npm stage publish`; a maintainer reviews and approves with 2FA; direct `npm publish` is rejected for that token; and other write permissions remain, including dist-tag changes and deprecations.
- Existing tokens are unchanged. The post avoids suggesting that every npm workflow is protected automatically.
- Brand-use review: https://docs.npmjs.com/policies/logos-and-usage/ says the npm logo requires permission and can imply affiliation. The cover uses only the product name in editorial text and npm's familiar red accent, without reproducing the official logo or implying endorsement.
