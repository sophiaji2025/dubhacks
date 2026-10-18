#!/bin/bash
# Load supabase/schema.sql. Safe to run again: the SQL skips objects that already exist.
# Usage: SUPABASE_DB_URL=postgres://... ./scripts/load-schema.sh
set -euo pipefail

if [ -z "$SUPABASE_DB_URL" ]; then
  echo "Set SUPABASE_DB_URL environment variable (e.g. postgres://user:pass@host:5432/db)"
  exit 1
fi

psql "$SUPABASE_DB_URL" -f supabase/schema.sql
