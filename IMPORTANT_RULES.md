# Important Rules

## Global AI Assistant Snapshots
- Use a shared Firestore collection named `modules_ai_reports`.
- Each module writes its own snapshots on a schedule that fits its logic.
- Snapshot document shape:
  - `moduleName`: string identifier of the module.
  - `timestamp`: ISO string or epoch milliseconds when the snapshot was generated.
  - `summaryJson`: aggregated/summarized module data (object).
- The global assistant reads snapshots for any date range; keep writes idempotent per module/timestamp pair where possible.

## Collection Naming Convention
- Any collection created/owned by a module must be named `{moduleName}_{collectionName}` to avoid collisions (e.g., `billing_invoices`, `inventory_items`).
