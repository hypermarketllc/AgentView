# ✅ Production Release Checklist

## 🔒 Pre-Release Validation
- [x] `dev-check.ts` passes
- [x] `runPatch.ts` confirms zero errors
- [x] `.env.docker` matches required config
- [x] Docker healthchecks enabled

## 🔨 Build Phase
- [x] Run `build-prod.sh`
- [x] Verify `/dist` exists and is hashed
- [x] `release.config.json` archived to `/releases`

## 🚀 Deployment
- [x] Deploy container via `docker-compose.console.yml`
- [x] Open `/console` dashboard and check all systems
- [x] Review `/logs` + `/errors` panel for warnings

## 📬 Announce
- [x] Update CHANGELOG.md
- [x] Tag git: `git tag v1.0.0 && git push origin v1.0.0`
- [x] Notify team