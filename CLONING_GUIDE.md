# Documentation Module

This module was created from the default-module template and implements a full-featured documentation management system similar to Outline.

## Cloning/Renaming This Module
When creating a new module from this template, replace all `documentation-module` references with the new module name.

1) Choose identifiers
   - Module name: `your-module-name`.
   - Module federation name: a unique JavaScript identifier (e.g., `yourModule`).

2) Update code & metadata
   - `package.json`: set `name` (and optional description) to the new module name.
   - `webpack.config.js`: in `ModuleFederationPlugin`, set `name` to the new federation id and update any exposed paths if needed.
   - `public/index.html`: set the page `<title>` to the new module name.
   - `deploy.sh`: set `MODULE_NAME` to the new module name so hosting site names and deploy target are derived correctly.
   - Any other references to `documentation-module` in code/config should be renamed accordingly.

3) Install and build
   - Install dependencies: `npm install`.
   - Build locally with the desired env file, e.g., `npm run build:test`.

4) Firebase specifics
   - See `FIREBASE_SETUP.md` (when asked to prepare for deploy) for hosting targets, aliases, site creation, environment configuration, and deploy steps.
