# Firebase Setup & Deploy

## Hosting identifiers
- Hosting target (in `firebase.json` and deploy commands): `your-module-name`.
- Hosting sites: production `hotcode-module-<module_name>`, test `module-<module_name>` (append a random suffix if the name is taken).

## Configure Firebase files
- `firebase.json`: set `hosting.target` to the new module target (e.g., `your-module-name`).
- `.firebaserc` (gitignored locally): map aliases to site names. Example structure:
```json
{
  "projects": { "test": "<test-project-id>", "prod": "<prod-project-id>" },
  "targets": {
    "test": { "hosting": { "your-module-name": ["module-your-module-name"] } },
    "prod": { "hosting": { "your-module-name": ["hotcode-module-your-module-name"] } }
  }
}
```

## Update deploy script
- In `deploy.sh`, set `MODULE_NAME` to your new module name. This drives the derived site names (`module-<module_name>` and `hotcode-module-<module_name>`) and the final deploy command.
- Update the deploy command to use the new hosting target: `firebase deploy --only hosting:your-module-name`.
- Keep the naming convention logic for site creation (test `module-<module_name>`, prod `hotcode-module-<module_name>`). Ensure these site names match what you created or were provided.

## Ensure hosting sites exist
- Run `firebase hosting:sites:create <site-name>` if missing. `deploy.sh` will also auto-create based on the naming convention when run after `firebase use <alias>`.

## Deploy steps
- Always run through the script: `./deploy.sh test` or `./deploy.sh prod`.
- The script:
  - Runs `firebase use <alias>` first (you must have `test`/`prod` aliases pointing to the right projects).
  - Ensures the hosting site exists (creates `module-<module_name>` or `hotcode-module-<module_name>` if absent).
  - Builds, then deploys to `hosting:your-module-name`.

## Deployment script behavior
- `deploy.sh` enforces the Firebase alias switch before any other command.
- Auto-creates hosting sites using the naming convention above (adds a suffix if Firebase requires uniqueness).
- Keeps hosting target aligned with `firebase.json` and `.firebaserc` mappings.
- Build happens after the alias switch so environment-specific Firebase config is active.

## Environment configuration
- `webpack.config.js` loads env vars from `.env.<mode>` by default (`.env.development` / `.env.production`) or an explicit file via `--env ENV_FILE=.env.test`.
- Pattern mirrors the dashboard module example (`/Users/denissheverdin/Desktop/work/hueta/erp.piche.dashboard-module/webpack.config.js`): local builds use `.env.*` files, while production values should be provided through Firebase config/secrets for the prod project.
- Add `ENV_FILE` when running custom builds: `webpack --mode production --env ENV_FILE=.env.staging`.
- Keep sensitive values out of version control; rely on Firebase project config for production secrets.
