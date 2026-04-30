#!/bin/sh
set -e

cd /app

npm install
export HOSTNAME=0.0.0.0
export PORT=3000
exec npm run dev
