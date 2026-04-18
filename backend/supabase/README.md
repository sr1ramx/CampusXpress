# CampusXpress Supabase Backend Kit

This folder contains a Supabase-first backend foundation for the existing CampusXpress app.

## Files

- `schema.sql`: PostgreSQL tables, constraints, indexes, and triggers.
- `policies.sql`: Row Level Security (RLS) policies.
- `rpc.sql`: SQL helper functions for business logic.
- `route-mapping.md`: mapping from current Express routes to Supabase queries/RPC.

## Apply Order

Run files in this order inside Supabase SQL Editor:

1. `schema.sql`
2. `rpc.sql`
3. `policies.sql`

## Required Environment Variables

Frontend (Netlify and local):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL` (optional if you still keep Express API)

## Notes

- Authentication should use Supabase Auth (`auth.users`).
- App profile data is stored in `public.profiles` and linked to `auth.users.id`.
- The SQL setup is designed to preserve your current backend behavior (orders, recycling, tasks, wallet, rentals, chats).
