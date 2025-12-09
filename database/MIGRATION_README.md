# Database Migration Guide

## Migration Files

### `migration-add-image-columns.sql`

**Purpose:** Adds `front_image_urls` and `back_image_urls` columns to existing `orders` table.

**When to use:**
- You already have an `orders` table
- You want to add support for separate front/back image tracking
- You're upgrading from an older version

**What it does:**
1. Adds `front_image_urls` JSONB column (defaults to empty array)
2. Adds `back_image_urls` JSONB column (defaults to empty array)
3. Verifies the columns were added successfully

**How to run:**
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `migration-add-image-columns.sql`
3. Click "Run" or press `Ctrl+Enter`
4. Check the output for success messages

**Safety:**
- ✅ Safe to run multiple times (uses `IF NOT EXISTS` checks)
- ✅ Won't delete or modify existing data
- ✅ Won't break if columns already exist

**After migration:**
- New orders will automatically populate `front_image_urls` and `back_image_urls`
- Existing orders will have empty arrays `[]` for these fields
- You can optionally uncomment the migration script section to extract URLs from existing `card_data`

## Full Schema vs Migration

### Use `schema.sql` if:
- Setting up a **new database** from scratch
- You don't have an `orders` table yet
- You want the complete schema with all columns

### Use `migration-add-image-columns.sql` if:
- You **already have** an `orders` table
- You want to **add** the new columns without recreating the table
- You want to preserve existing data

## Verifying Migration

After running the migration, verify it worked:

```sql
-- Check if columns exist
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN ('front_image_urls', 'back_image_urls')
ORDER BY column_name;
```

You should see:
```
column_name        | data_type | column_default
-------------------+-----------+----------------
back_image_urls    | jsonb     | '[]'::jsonb
front_image_urls   | jsonb     | '[]'::jsonb
```

## Troubleshooting

### Error: "column already exists"
- This is fine! The migration checks for existing columns
- Your database already has the columns

### Error: "relation 'orders' does not exist"
- You need to run `schema.sql` first to create the table
- Then you can run the migration if needed

### Want to populate existing orders?
- Uncomment the optional migration section in the SQL file
- Modify it based on your `card_data` structure
- Run it to extract URLs from existing orders

