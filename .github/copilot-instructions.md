# Copilot Instructions for endyear-bot

## Project Overview
Single-file Node.js bot that sends scheduled WhatsApp messages via WAHA API on specific dates (Christmas & New Year). Uses lock files to prevent duplicate sends and auto-logs all operations with timestamps.

## Architecture & Core Flow

**Main Components** (all in `main.js`):
1. **CronJob**: Runs at interval defined by `CRON_TIME` env var (default: every 5 minutes), checks date/time vs `DATA_NATAL`/`DATA_ANO_NOVO` env vars in GMT-3 timezone
2. **Lock System**: Creates `natal_finished.lock` or `ano_novo_finished.lock` after successful batch send
3. **Retry Logic**: Auto-retries failed sends by removing 5th digit from userId (Brazilian phone format correction: `5561999999999` → `556199999999`)
4. **Logging**: Dual output (console + file `logs_YYYY-MM-DD_HH-MM-SS.txt`) with ISO timestamps

**Critical Pattern**: The `EXECUTION` flag prevents CronJob re-entry during active batch processing.

## WAHA Integration (Required External Dependency)

This bot is **not standalone** - it requires a running WAHA (WhatsApp HTTP API) instance:
- API endpoint: `{WAHA_URL_API}/api/sendText`
- Authentication: `X-Api-Key` header
- Message format: `{session, chatId: "userId@c.us", text}`

Test WAHA availability before debugging message failures.

## Data Format Conventions

**contatos.txt** (CSV, no headers):
```
Nome,5511999999999
```

**Message templates** (`msg_natal.txt`, `msg_ano_novo.txt`):
- Use `$nome$` placeholder (global regex replace, not single-shot)
- Plain text with emojis supported

**.env variables**:
- `WAHA_URL_API` - base URL WITHOUT trailing `/api/sendText`
- `DATA_NATAL` / `DATA_ANO_NOVO` - Date and time format `YYYY-MM-DD HH:mm` (GMT-3 timezone)
- `CRON_TIME` - Cron expression for check interval (default: `*/5 * * * *` = every 5 minutes)

## Key Developer Workflows

**Testing without waiting for scheduled dates**:
1. Set `.env` dates to current time: `DATA_NATAL=2025-12-31 15:50`
2. Optionally set faster check interval: `CRON_TIME=*/1 * * * *`
3. Delete lock files: `rm *.lock`
4. Run: `npm start`
5. Bot triggers immediately if current time >= configured time, creates new locks

**Reset for re-send**:
```bash
rm *.lock
npm start
```

**View logs** (latest first):
```bash
ls -t logs_*.txt | head -1 | xargs cat
```

## Critical Timing Constraints

- **10-second delay** between individual message sends (configurable in code)
- **Configurable CronJob interval** via `CRON_TIME` env var (default: every 5 minutes)
- First execution happens immediately on startup (before CronJob)
- Date/time comparisons use GMT-3 (America/Sao_Paulo) timezone

## Error Handling Pattern

All `sendMessage()` errors trigger automatic retry with phone number correction:
```javascript
// Original: 5561999999999 (DDI + DDD + 9 + número)
// Retry:    556199999999  (removes 5th digit)
```

This handles Brazilian mobile number format changes. If both attempts fail, continues to next contact (no abort).

## Logging Pattern

**Always use `await log(message)` instead of `console.log`**:
- Writes to both console and timestamped file
- Format: `[2025-12-24T15:30:45.123Z] message`
- File created on startup, never rotates during execution

## Files Not in Version Control
See `.gitignore`:
- `.env` (secrets)
- `contatos.txt` (PII)
- `*.lock` (runtime state)
- `logs_*.txt` (generated output)
- `node_modules/`

Use `.example` files as templates for these.

## Common Pitfalls

1. **Wrong date/time format in .env**: Must be `YYYY-MM-DD HH:mm`, not `DD/MM/YYYY` or other formats
2. **Timezone confusion**: All times are GMT-3 (Brasília), not UTC or local machine time
3. **Invalid CRON_TIME**: Must be valid cron expression (5 fields: min hour day month weekday)
4. **WAHA not running**: Check API URL is reachable before assuming code issues
5. **Lock files persist**: Delete manually to re-test sends
6. **Async logging**: All `log()` calls need `await` or messages may be lost on crash

## Extension Points

When adding new scheduled dates:
1. Add date to `.env` (e.g., `DATA_PASCOA=2026-04-05`)
2. Create message template file (e.g., `msg_pascoa.txt`)
3. Add lock constant: `const PASCOA_LOCK = path.join(__dirname, 'pascoa_finished.lock')`
4. Add date check in `checkAndSend()` function
5. Update `.gitignore` if needed
