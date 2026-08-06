2026-08-05T22:23:45-04:00

# Laboratory Strategy Inventory

Source of truth:
- src/laboratory/modules/LaboratoryModuleCatalog.js
- src/laboratory/LaboratoryRegistry.js

Registry behavior:
- LaboratoryRegistry normalizes each module definition and registers it by manifest.id.
- list() returns the registered module definitions.
- getCapabilities(id) returns the normalized capability list for a given module.

Catalogued modules currently discovered in the laboratory catalog:

| id | name | category | capabilities | description |
|---|---|---|---|---|
| lab.con | Lab_Con | consensus | consensus, delay-weighted scoring | Analytical consensus module for delay-weighted set scoring. |
| lab.con1 | Lab_Con1 | consensus | consensus, dataset-backed Win-Win analysis | Win-Win weighted consensus module backed by dataset composition. |
| at.rep | AtRep | consensus | attraction, repulsion, subset analysis | Attraction and repulsion module over roulette subsets. |
| win.win | WinWin | consensus | historical analytics, streaks, tables | Historical Win-Win analytics module for tables and streaks. |
| da | DA | consensus | absolute-distance analytics, timing tables | Absolute distance analytics module for spin timing tables. |
| historical-evidence.dataset-provider | Historical Evidence Dataset Provider | dataset-provider | dataset, snapshot, historical-evidence | Official dataset provider for the laboratory runner. |

Notes:
- The catalog is intentionally small and focused on the laboratory consensus/data pipeline.
- The inventory should be refreshed if new modules are added to the catalog or registry shape changes.
