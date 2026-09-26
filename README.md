# ZeWealth v5

Frontend personal finance app with localStorage, CSV import/export, monthly budget calculations, and PWA support.

## Local desktop
Open `index.html` for basic testing. For PWA/service-worker behavior, serve the folder over HTTP (for example with VS Code Live Server or `python -m http.server`).

## Phone / GitHub Pages
Upload the root files (`index.html`, `style.css`, `script.js`, `manifest.webmanifest`, `sw.js`) to a GitHub repository and enable GitHub Pages. Open the Pages URL on your phone, then use the browser's Add to Home Screen option.

## Storage
Transactions, budgets, settings, and profile data are stored in browser localStorage. CSV export is the portable backup. Do not upload your personal CSV backups to a public GitHub repository.
