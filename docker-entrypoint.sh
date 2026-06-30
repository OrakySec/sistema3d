#!/bin/sh
set -e

echo "▶ Aplicando schema no banco..."
node node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss

echo "▶ Iniciando aplicação..."
exec node server.js
