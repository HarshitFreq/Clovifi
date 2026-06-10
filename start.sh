#!/bin/bash
# Clovifi — start both servers
export DATABASE_URL="postgresql://localhost/aerofinance"
export PORT=8080
export NODE_ENV=development

cd "$(dirname "$0")"

echo "▶ Building & starting API server on :8080..."
(cd artifacts/api-server && npm run build && PORT=8080 DATABASE_URL="postgresql://localhost/aerofinance" node --enable-source-maps ./dist/index.mjs) &
API_PID=$!

sleep 4
echo "▶ Starting frontend on :19051..."
(cd artifacts/finance-tracker && PORT=19051 BASE_PATH=/ npx vite --config vite.config.ts --host 0.0.0.0) &
FE_PID=$!

echo ""
echo "✅ Both servers running."
echo "   Frontend → http://localhost:19051"
echo "   API      → http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop both."

trap "kill $API_PID $FE_PID 2>/dev/null; exit" INT TERM
wait
