#!/bin/bash
# Simple helper to load schema into Supabase (assumes `psql` and environment variables are set)
# Usage: ./scripts/load-schema.sh

if [ -z "$SUPABASE_DB_URL" ]; then
  echo "Set SUPABASE_DB_URL environment variable (e.g. postgres://user:pass@host:5432/db)"
  exit 1
fi

psql "$SUPABASE_DB_URL" -f supabase/schema.sql
