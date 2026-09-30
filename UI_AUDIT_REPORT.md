# Memoir UI and Flow Audit

## Test matrix

Automated Chromium checks were run at:

- 320 x 568 small phone
- 375 x 667 phone
- 390 x 844 phone
- 768 x 1024 tablet boundary
- 1440 x 900 laptop

Authenticated and guest flows were exercised. No credentials are stored in this report or project files.

## Flows verified

- Guest home and navigation
- Supabase sign in
- Authenticated home with a 6,769-message encrypted chat
- Chat rendering and starring controls
- Contextual search with 30 matches and previous/next navigation
- Starred and Scrapbooks routes
- Guest and authenticated scrapbook creation
- Mobile and desktop canvas layouts
- Signed-in encrypted scrapbook write and deletion
- Refresh, locked-vault screen, and password unlock

## Issues found and fixed

1. Search result scrolling moved the entire mobile document, hiding the search bar. Search now scrolls only the internal conversation list.
2. Chat height did not account precisely for both mobile navigation bars. Mobile and desktop viewport calculations were corrected.
3. Search arrow and close controls had undersized touch targets. They now use 40-pixel targets.
4. Unstarred messages could not expose their star control reliably on touch devices. Tapping a message now reveals its star action; starred messages remain visibly marked.
5. The phone toolbar was checked down to 320 pixels and all eight tools remain visible without horizontal overflow.
6. Key mobile canvas header controls were enlarged to 44-pixel touch targets.
7. Login password visibility and logout controls were enlarged for touch accessibility.

## Results

- Horizontal overflow: none at tested widths
- Mobile canvas vertical overflow: none at tested phone heights
- Signed-in encrypted database write: passed
- Null-salt regression: not reproduced after fix
- Refresh and unlock: passed
- Runtime application errors: none in tested production flows
- Production build: passed
- npm audit: zero known vulnerabilities

Development-only Vite HMR websocket warnings caused by the sandbox proxy were excluded; they do not occur in the Vercel production build.
