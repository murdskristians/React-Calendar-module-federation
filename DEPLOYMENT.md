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
