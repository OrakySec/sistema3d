#!/bin/sh
set -e

echo "▶ Rodando migrações do banco..."
node node_modules/prisma/build/index.js migrate deploy

echo "▶ Iniciando aplicação..."
exec node server.js
