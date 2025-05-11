# 🛠️ Error Fixes, Tools, Console Interface, and System Integration Guide

This documentation outlines all critical bug fixes, the detailed steps taken to implement the solutions, the files involved, and how the Console CLI + Panel architecture supports a fully debuggable and patchable production system.

---

## 🔧 Common Errors and Fixes

| Error Code / Issue                      | Resolution Summary                                                                   | Files Involved                                   |
|----------------------------------------|--------------------------------------------------------------------------------------|--------------------------------------------------|
| Missing 404 handler                    | Inject a wildcard fallback route to catch all unknown paths                         | `patch-express-404-handler.ts`                   |
| Brute-force login attempt              | Apply `express-rate-limit` to auth route to limit repeated attempts                  | `auth.routes.ts`, `loginLimiter.ts`              |
| Legacy Supabase usage                  | Remove all supabase-specific logic, switch to internal API endpoints                 | `supabase.ts`, `consoleRoutes.ts`                |
| Missing LIMIT in SQL queries           | Add logic to auto-append `LIMIT 100` if query lacks it                               | `fixMissingLimitQueries.ts`                      |
| Insecure JWT handling                  | Ensure `JWT_SECRET` is mandatory before app boots                                    | `patch-env-validator.ts`, `statusValidator.ts`   |
| GET endpoints return HTML              | Validate `Content-Type` headers for JSON compliance                                  | `validate-api-responses.ts`                      |
| Unstructured patching                  | Introduce CLI patch runner, central dispatcher, patch logging                        | `runPatch.ts`, `bundleConsolePatch.ts`           |
| Route registry lacks validation        | Automatically verify every route has method + path                                   | `validateRouteRegistry.ts`, `routeRegistry.ts`   |
| Duplicate route handler logic          | Static scan for function name duplication                                            | `detectDuplicateFunctions.ts`                    |
| No global Express error handler        | Attach final error middleware for fallback handling                                  | `errorHandler.ts`                                |
| Console not debuggable post-update     | Implement visual console dashboard, patch starter, live status                       | `StartConsolePanel.tsx`, `LogsPanel.tsx`, `ErrorPanel.tsx` |
| Logs not captured                      | Introduce DB error logging + WebSocket-based log broadcaster                         | `logSocketServer.ts`, `logErrorToDB.ts`          |

---

## ⚙️ Patch System Implementation – Step-by-Step

**Patch Lifecycle:**
1. All patch scripts are located in `/tools/patch/`
2. Add your new fix as a script there, export as a function
3. Register it in `runPatch.ts` or use dynamic auto-import via registry
4. Run `ts-node runPatch.ts` to apply all available patches
5. System logs patch versions in `PatchVersionLog.json`
6. Run from API via `POST /console/patch`

**Key Files:**
- `runPatch.ts`: Executes all patches in order
- `bundleConsolePatch.ts`: Wraps and logs patch suite
- `patch-env-validator.ts`: Ensures `.env` is valid
- `patch-express-404-handler.ts`: Adds 404 fallback route
- `fixMissingLimitQueries.ts`: Protects queries from pagination issues

---

## 🧰 Using the Console CLI + Dashboard

The Console is both a control layer and a visual interface.

### ✅ Console CLI
- Entry point: `startprogram.ts`
- Runs: `dev-check.ts` → validates ports, envs, folders, and DB
- Auto-starts server after success
- Emits real-time logs to WebSocket clients

### ✅ Console Web Dashboard (UI)
- Tabs:
  - **Start:** Launch diagnostics, see DB/API/frontend status indicators
  - **Logs:** View live backend logs (via WebSocket)
  - **Errors:** View recent runtime issues from `system_errors` DB
  - **Patch:** Trigger patch suite manually
- Light indicators show red/green per component (DB, frontend, routes, etc)

**Files powering the UI:**
- `ConsoleDashboardLayout.tsx`
- `StartConsolePanel.tsx`
- `LogsPanel.tsx`
- `ErrorLogPanel.tsx`
- `ErrorPanel.tsx`
- WebSocket backend: `logSocketServer.ts`

---

## 🔁 How to Implement All Fixes (End-to-End Process)

1. Clone the repo & install dependencies
2. Set environment:
   ```bash
   ts-node setEnv.ts docker
   ```
3. Run validation:
   ```bash
   ts-node dev-check.ts
   ```
4. Launch the app:
   ```bash
   ts-node startprogram.ts
   ```
5. Trigger patch suite:
   ```bash
   ts-node runPatch.ts
   # OR use UI > Patch Tab > Trigger button
   ```
6. Review outputs:
   - `PatchVersionLog.json`
   - Console UI status indicators
   - `system_errors` DB logs
7. Deploy:
   ```bash
   sh build-prod.sh
   docker-compose -f docker-compose.console.yml up --build
   ```

---

## 🔐 Security Best Practices
- Do not commit `.env.*` files
- Use `.env.docker` for container-based setups
- Run `patch-env-validator.ts` in CI to fail fast
- Ensure `JWT_SECRET` is always injected
- Role/permission enforced in routes via `requirePermission.ts`

---

## 📘 Maintenance Tips
- Use `detectDuplicateFunctions.ts` before committing route/logic updates
- Always run `validateRouteRegistry.ts` if a route is added/removed
- Use `LogsPanel` or WS log stream to debug crashes
- Keep `PatchVersionLog.json` as your rollback trace
- Validate all endpoints using `validate-api-responses.ts` after each patch
