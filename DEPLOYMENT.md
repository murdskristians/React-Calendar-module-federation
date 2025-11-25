# Deployment Instructions

## Prerequisites
- Node.js and npm installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Authenticated with Firebase (`firebase login`)

## Environments
- **Test**: Deploys to the test project/alias.
- **Production**: Deploys to the production project/alias.

## How to Deploy

### Test Environment
```bash
./deploy.sh test
```

### Production Environment
```bash
./deploy.sh prod
```

## Manual Steps
1. Switch environment: `firebase use <alias>`
2. Build: `npm run build:<env>`
3. Deploy: `firebase deploy --only hosting:default-module`

## Creating a New Module (Firebase Setup)
- Pick a hosting target name (e.g. `my-new-module`); this name is used in both `firebase.json` and the deploy script.
- `firebase.json`: change `hosting.target` to the new module name. The target key must match what you pass to `firebase deploy --only hosting:<target>`.
- `.firebaserc` (gitignored locally): add targets for both aliases so Firebase knows which Hosting site to use per environment. Example:
```json
{
  "projects": { "test": "<test-project-id>", "prod": "<prod-project-id>" },
  "targets": {
    "test": { "hosting": { "my-new-module": ["my-new-module-test"] } },
    "prod": { "hosting": { "my-new-module": ["my-new-module"] } }
  }
}
```
-  - Create the Hosting sites (`firebase hosting:sites:create <site-name>`) if they do not exist. Naming convention: production sites `hotcode-module-<module_name>`, test sites `module-<module_name>`; append a random number if Firebase requires uniqueness. But before each command use firebase use with targeted environment.
- `deploy.sh`: update the final command to use the new target (`firebase deploy --only hosting:my-new-module`). Adjust log text if you rename the module.
