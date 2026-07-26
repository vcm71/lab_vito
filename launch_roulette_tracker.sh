#!/usr/bin/env bash
# Liberar puerto preventivamente antes de levantar Vite
fuser -k 4173/tcp 2>/dev/null || true
npm run dev

#!/usr/bin/env bash
set -euo pipefail

cd /home/shared/lab_vito
exec npm run dev -- --host 127.0.0.1 --port 4173 --strictPort --configLoader native
