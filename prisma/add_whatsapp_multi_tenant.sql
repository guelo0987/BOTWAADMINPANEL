-- Multi-tenant WhatsApp: add per-client credentials to clients
-- Run this if your DB does not yet have these columns (e.g. psql -f prisma/add_whatsapp_multi_tenant.sql).

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS whatsapp_access_token TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_app_secret TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_api_version TEXT DEFAULT 'v21.0';
