
# ✅ Cline Rules – Developer Checklist Format

This file is designed to be pasted into Cline's **Workspace Rules** UI (VS Code Extension) in markdown format.

---

## 🔧 Behavior Rules

### 1. ✅ Patch Verification Before Start
- **Trigger**: When running `npm start`
- **Action**: Automatically runs patch validator
- **Command**: `ts-node tools/patch/runPatch.ts`

### 2. ✅ Strict ENV File Enforcement
- **Trigger**: On env file load
- **Accepted**: `.env.docker`, `.env.local`, `.env.production`
- **Note**: All other files rejected

### 3. ✅ Validate Route Registry Before Git Commit
- **Trigger**: `git commit`
- **Command**: `ts-node tools/patch/validateRouteRegistry.ts`
- **Purpose**: Prevent broken route exports

### 4. ⚠️ Warn on Large Files
- **Trigger**: File save
- **Condition**: More than 20 functions
- **Action**: Warns in terminal/logs

### 5. 🔄 Auto-Sort Imports
- **Trigger**: File save
- **Action**: Reorders imports alphabetically to maintain structure

---

## 🔀 Custom Commands

You can type these inside Cline command palette:

| Command             | What it does                                                    |
|---------------------|-----------------------------------------------------------------|
| `console.start`     | Starts full dev system (`dev-check`, patch, docker)             |
| `console.patch`     | Applies all registered patch tools                              |
| `console.envSwitch` | Switches `.env` between `local`, `docker`, `production`         |
| `console.deploy`    | Builds and deploys full Docker release                          |
| `console.test`      | Tests whether all key API endpoints respond with valid JSON     |

---

Paste this into `Cline > Manage Workspace Rules` to enforce coding discipline and deploy safety.
