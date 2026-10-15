#!/bin/sh
# Seed the database in background after network is ready, then start the app immediately
(sleep 20 && npx prisma migrate deploy && npx tsx prisma/seed.ts && echo "DB ready") &
exec npx next start
