
# ✅ Cline Workspace Rules – Console Project

## Behavior Rules

### 🔧 1. Run Patch Tools Before Dev Start
- **Trigger**: `npm start`
- **Action**: Run `ts-node tools/patch/runPatch.ts`

### 🔐 2. Enforce Valid ENV Files
- **Trigger**: `env:load`
- **Allowed Files**: `.env.docker`, `.env.local`, `.env.production`

### 📦 3. Validate Route Registry Before Commit
- **Trigger**: `git commit`
- **Action**: Run `ts-node tools/patch/validateRouteRegistry.ts`

### 🧠 4. Warn for Files with 20+ Functions
- **Trigger**: `file:save`
- **Limit**: 20 functions
- **Action**: Show warning

### 🌀 5. Auto-Sort Imports on Save
- **Trigger**: `file:save`
- **Action**: `sort-imports`

---

## Custom Commands

| Command            | Action                                                                 |
|--------------------|------------------------------------------------------------------------|
| `console.start`    | `ts-node scripts/dev-start.ts`                                         |
| `console.patch`    | `ts-node tools/patch/runPatch.ts`                                      |
| `console.envSwitch`| `ts-node scripts/setEnv.ts`                                            |
| `console.deploy`   | `./build-prod.sh && docker-compose -f docker-compose.console.yml up`   |
| `console.test`     | `ts-node tools/patch/validate-api-responses.ts`                        |

---

Paste this file into **Workspace Rules** in the Cline VS Code extension.
