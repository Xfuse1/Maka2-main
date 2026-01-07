# Supabase/Postgres Database Migration Guide

Complete migration toolkit for exporting and restoring Supabase/PostgreSQL databases with full RLS (Row Level Security) preservation.

## 🎯 Overview

This migration system provides:

- ✅ **Complete schema export** (tables, indexes, constraints, functions, triggers, views, types)
- ✅ **Full data export** with optimized performance
- ✅ **RLS preservation** (policies and enablement)
- ✅ **Safe restore** with transaction safety and error handling
- ✅ **Verification tools** to ensure migration success
- ✅ **Detailed audit reports** for RLS and data integrity

## 📋 Prerequisites

### Required Tools

1. **PostgreSQL Client Tools** (pg_dump, psql)
   - Windows: [Download from PostgreSQL.org](https://www.postgresql.org/download/windows/)
   - Verify installation: `pg_dump --version`

2. **PowerShell** (included with Windows)
   - Windows 10+ includes PowerShell 5.1 or later

3. **Database Connection Strings**
   - Source database (OLD_DB_URL): The database you want to export
   - Target database (NEW_DB_URL): The database you want to import to

### Getting Connection Strings from Supabase

1. Go to your Supabase project dashboard
2. Navigate to: **Project Settings → Database**
3. Copy the **Connection string (URI)** under "Connection string"
4. Format: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@[HOST]:[PORT]/postgres`

**Connection Types:**
- **Direct connection**: Port 5432 (recommended for migrations)
- **Connection pooler**: Port 6543 (for applications)

## 🚀 Quick Start

### Step 1: Setup Environment

1. Copy the environment template:
   ```powershell
   Copy-Item scripts\.env.example scripts\.env
   ```

2. Edit `scripts\.env` and add your database URLs:
   ```bash
   OLD_DB_URL=postgresql://postgres.xxxx:password@host:5432/postgres
   NEW_DB_URL=postgresql://postgres.yyyy:password@host:5432/postgres
   ```

### Step 2: Export from Source Database

```powershell
cd scripts
.\export.ps1
```

This will create:
- `migrations/export_YYYYMMDD_HHMMSS/` directory containing:
  - `01_extensions.sql` - Database extensions
  - `02_schema.sql` - Complete DDL with RLS
  - `03_data.sql` - All table data
  - `04_rls_policies.sql` - Extracted RLS policies (audit)
  - `05_table_statistics.sql` - Row count verification queries
  - `06_roles.sql` - Role information (reference)
  - `MANIFEST.md` - Export summary
- `reports/rls_report_YYYYMMDD_HHMMSS.md` - Detailed RLS audit

### Step 3: Restore to Target Database

```powershell
.\restore.ps1
```

**What happens:**
- Installs extensions
- Imports schema with RLS policies
- Imports data (with RLS temporarily bypassed for performance)
- Synchronizes sequences
- Verifies RLS enablement
- Generates restore report

### Step 4: Verify Migration

```powershell
.\verify.ps1
```

**Verification includes:**
- Database connectivity
- Extension comparison
- Table structure and counts
- Row count validation
- RLS status and policy verification
- Function and trigger counts
- Sample data validation

## 📁 Directory Structure

```
makastore-main/
├── scripts/
│   ├── .env.example          # Environment template
│   ├── .env                  # Your config (git-ignored)
│   ├── export.ps1            # Export script
│   ├── restore.ps1           # Restore script
│   └── verify.ps1            # Verification script
├── migrations/
│   ├── README.md             # This file
│   └── export_YYYYMMDD_HHMMSS/  # Export directories (git-ignored)
│       ├── 01_extensions.sql
│       ├── 02_schema.sql
│       ├── 03_data.sql
│       ├── 04_rls_policies.sql
│       ├── 05_table_statistics.sql
│       ├── 06_roles.sql
│       └── MANIFEST.md
└── reports/
    ├── .gitkeep
    ├── RLS_REPORT_README.md  # RLS documentation
    ├── rls_report_*.md       # RLS audit reports (git-ignored)
    ├── restore_report_*.md   # Restore reports (git-ignored)
    └── verify_report_*.md    # Verification reports (git-ignored)
```

## 🔧 Advanced Usage

### Exporting Specific Export Directory

By default, restore uses the latest export. To specify a directory:

```powershell
.\restore.ps1 -ExportDir "migrations\export_20251217_103045"
```

### Using Custom Environment File

```powershell
.\export.ps1 -EnvFile "production.env"
.\restore.ps1 -EnvFile "production.env"
.\verify.ps1 -EnvFile "production.env"
```

### Manual Export with pg_dump

If you need to customize the export:

```powershell
# Schema only
pg_dump $env:OLD_DB_URL `
  --schema=public `
  --schema-only `
  --no-owner `
  --no-privileges `
  -f schema.sql

# Data only
pg_dump $env:OLD_DB_URL `
  --schema=public `
  --data-only `
  --disable-triggers `
  --column-inserts `
  -f data.sql
```

### Manual Restore with psql

```powershell
# Restore schema
psql $env:NEW_DB_URL -v ON_ERROR_STOP=1 --single-transaction -f schema.sql

# Restore data
psql $env:NEW_DB_URL -v ON_ERROR_STOP=1 --single-transaction -f data.sql
```

## 🔍 Understanding RLS Export

### What Gets Exported

1. **RLS Enablement**
   ```sql
   ALTER TABLE tablename ENABLE ROW LEVEL SECURITY;
   ```

2. **RLS Policies**
   ```sql
   CREATE POLICY policy_name ON tablename
   FOR SELECT
   USING (auth.uid() = user_id);
   ```

### Verifying RLS in Export

Check `02_schema.sql` contains:
- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` statements
- `CREATE POLICY` statements with full definitions

Check `04_rls_policies.sql` for extracted policies (audit copy)

Check `reports/rls_report_*.md` for complete RLS audit

## 🛡️ Safety Features

### Export Safety
- ✅ Tests database connection before export
- ✅ Creates timestamped directories (no overwrites)
- ✅ Validates pg_dump success before continuing
- ✅ Generates verification queries

### Restore Safety
- ✅ Confirms target database before proceeding (requires typing "RESTORE")
- ✅ Uses `--single-transaction` (all-or-nothing restore)
- ✅ Uses `ON_ERROR_STOP=1` (stops on first error)
- ✅ Sets `session_replication_role = replica` during data load (bypasses triggers/RLS for performance)
- ✅ Restores normal operation after data load
- ✅ Synchronizes sequences automatically

### Data Integrity
- ✅ Row count verification
- ✅ Table structure comparison
- ✅ RLS policy validation
- ✅ Sample data checks

## 📊 Reports Guide

### Export Manifest
Location: `migrations/export_YYYYMMDD_HHMMSS/MANIFEST.md`

Contains:
- Export timestamp
- File list with descriptions
- Import order instructions
- Notes about encoding and flags

### RLS Audit Report
Location: `reports/rls_report_YYYYMMDD_HHMMSS.md`

Contains:
- Summary statistics (total tables, RLS-enabled tables, policy count)
- Table-by-table RLS status
- Detailed policy definitions with USING/WITH CHECK clauses

### Restore Report
Location: `reports/restore_report_YYYYMMDD_HHMMSS.md`

Contains:
- Restore timestamp and database info
- Step-by-step completion status
- RLS verification results
- Table statistics with row counts

### Verification Report
Location: `reports/verify_report_YYYYMMDD_HHMMSS.md`

Contains:
- Connection test results
- Extension comparison
- Table and row count validation
- RLS policy verification
- Function/trigger counts
- Sample data validation

## ⚠️ Troubleshooting

### "pg_dump not found"
**Solution:** Install PostgreSQL client tools and add to PATH
- Download: https://www.postgresql.org/download/windows/
- Verify: `pg_dump --version`

### "Connection failed"
**Solution:** Check connection string format and credentials
- Verify format: `postgresql://user:pass@host:port/database`
- Test: `psql $env:OLD_DB_URL -c "SELECT 1;"`
- Check Supabase project is running
- Verify password is correct
- Use port 5432 for direct connection

### "Extension ... does not exist"
**Solution:** Some extensions require superuser
- uuid-ossp, pgcrypto should work automatically
- Check Supabase dashboard: Database → Extensions
- Contact Supabase support for special extensions

### "Row count mismatch"
**Possible causes:**
- Data was modified during export/restore
- Triggers created/deleted rows during import
- Review specific tables in verification report
- Re-run export and restore if needed

### "RLS policies missing"
**Solution:**
- Check `02_schema.sql` contains `CREATE POLICY` statements
- Verify pg_dump version (use 12+)
- Ensure you're using `--schema=public` flag
- Check source database actually has RLS enabled: 
  ```sql
  SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
  ```

### "Permission denied"
**Solution:**
- Ensure database user has necessary privileges
- For Supabase, use the postgres role connection string
- Check Project Settings → Database → Connection string

### "Transaction deadlock"
**Solution:**
- Ensure no other applications are writing to target database during restore
- Use a fresh/empty target database
- Close all other database connections

## 🔐 Security Best Practices

1. **Never commit .env files**
   - Use `.env.example` as template
   - Add `.env` to `.gitignore` (already configured)

2. **Protect connection strings**
   - Store in environment variables or secure vaults
   - Rotate database passwords regularly
   - Use read-only credentials for exports when possible

3. **Verify target database**
   - Always restore to a test environment first
   - Confirm database URLs before running restore
   - Keep backups of production databases

4. **Review RLS policies**
   - Check audit reports after migration
   - Test RLS with different user roles
   - Verify policies work as expected

## 📚 Additional Resources

### Documentation
- [PostgreSQL pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Database Guide](https://supabase.com/docs/guides/database)

### Migration Scenarios

#### Scenario 1: Development to Staging
```powershell
# 1. Export from dev
$env:OLD_DB_URL = "postgresql://dev-connection-string"
.\export.ps1

# 2. Restore to staging
$env:NEW_DB_URL = "postgresql://staging-connection-string"
.\restore.ps1

# 3. Verify
.\verify.ps1
```

#### Scenario 2: Clone Production Database
```powershell
# Use read-only connection for source
$env:OLD_DB_URL = "postgresql://readonly@prod:5432/postgres"
$env:NEW_DB_URL = "postgresql://new-project-connection-string"

.\export.ps1
.\restore.ps1
.\verify.ps1
```

#### Scenario 3: Migrate to New Supabase Region
```powershell
# Export from old region
$env:OLD_DB_URL = "postgresql://us-east-connection"
.\export.ps1

# Restore to new region
$env:NEW_DB_URL = "postgresql://eu-west-connection"
.\restore.ps1
.\verify.ps1
```

## 🤝 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review generated reports in `reports/` directory
3. Verify PostgreSQL client tools are installed
4. Test database connections manually with psql
5. Check Supabase project status and logs

## 📝 Notes

- **Performance**: Large databases (1GB+) may take several minutes to export/restore
- **Disk Space**: Ensure sufficient disk space for exports (at least 2x database size)
- **Network**: Stable internet connection recommended for cloud databases
- **Compatibility**: Works with PostgreSQL 12+ and all Supabase projects
- **RLS**: All RLS policies and enablement are preserved automatically
- **Sequences**: Automatically synchronized after data import
- **Triggers**: Temporarily disabled during data import for performance

## ✅ Checklist

Before migration:
- [ ] Install PostgreSQL client tools
- [ ] Create `.env` file with connection strings
- [ ] Test source database connection
- [ ] Test target database connection
- [ ] Ensure target database is empty/fresh
- [ ] Verify sufficient disk space

During export:
- [ ] Run `.\export.ps1`
- [ ] Check export completed without errors
- [ ] Review generated files in `migrations/export_*/`
- [ ] Review RLS audit report in `reports/`

During restore:
- [ ] Run `.\restore.ps1`
- [ ] Confirm "RESTORE" when prompted
- [ ] Wait for completion (don't interrupt)
- [ ] Check for any error messages

After migration:
- [ ] Run `.\verify.ps1`
- [ ] Review verification report
- [ ] Check row counts match
- [ ] Verify RLS policies present
- [ ] Test application with new database
- [ ] Test RLS with different user roles

---

**Ready to migrate?** Start with `.\export.ps1` 🚀
