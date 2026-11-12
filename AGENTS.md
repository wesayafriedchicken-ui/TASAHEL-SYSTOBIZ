# Project Guidelines & Persistent Instructions

## Core Security & Database Rules

### Supabase API May 2026 Update Integration Guide
As of the May 2026 Supabase update, the `public` schema no longer grants automatic SELECT/INSERT/UPDATE/DELETE permissions to the Data API. 

When writing PostgreSQL migration scripts, table setups, or SQL configurations:
1. **Explicit Permissions Required**: You must explicitly grant permissions to authenticated users and service roles.
2. **Execution Order**: Explicit `GRANT` statements must be declared **before** turning on Row Level Security (RLS) and setting up Policies.

#### Required SQL Pattern Example:
```sql
-- 1. Create the Table
CREATE TABLE public.my_new_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL
);

-- 2. EXPLICIT GRANTS (CRITICAL: Do this step before RLS policies to prevent Error 42501)
GRANT ALL ON TABLE public.my_new_table TO postgres;
GRANT ALL ON TABLE public.my_new_table TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.my_new_table TO authenticated;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.my_new_table ENABLE ROW LEVEL SECURITY;

-- 4. Declare Specific Policies
CREATE POLICY "Allow authenticated users to read their own data"
    ON public.my_new_table
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
```
