# ✅ Contributor Onboarding Checklist

## 🔧 Dev Setup
- [ ] Clone repo
- [ ] Copy `.env.docker` → `.env`
- [ ] Run `ts-node dev-check.ts`

## 🚦 While Coding
- [ ] Validate routes
- [ ] Run patch suite before PR
- [ ] Add logs + error guards

## 📦 Pre-Deploy
- [ ] `build-prod.sh` runs clean
- [ ] `/api/console/status` returns 200
- [ ] No unresolved console errors