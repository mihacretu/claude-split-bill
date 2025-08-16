# Database

This folder contains all database-related files for the Claude Split Bill App.

## Structure

```
database/
├── README.md                    # This file
├── database-structure.md        # Detailed database schema documentation
└── migrations/
    └── 001_initial_schema.sql   # Initial database schema migration
```

## Files

### Migrations

The `migrations/` folder contains SQL migration files that set up and modify the database schema.

- **001_initial_schema.sql** - Complete initial database schema including:
  - All tables (users, hangouts, bills, payments, etc.)
  - Relationships and foreign keys
  - Indexes for performance
  - Row Level Security (RLS) policies
  - Triggers and functions
  - Permissions and grants

### Documentation

- **database-structure.md** - Comprehensive documentation of the database schema, relationships, and business logic

## Usage

### Running Migrations

To set up the database in Supabase:

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `migrations/001_initial_schema.sql`
4. Execute the migration

### Adding New Migrations

When adding new migrations:

1. Create a new file with the next sequential number: `002_description.sql`
2. Include both the migration SQL and rollback SQL if possible
3. Update this README with the new migration description

## Schema Overview

The database supports a complete bill-splitting application with:

- **User Management** - User profiles and friendships
- **Hangouts** - Social gatherings where bills are split
- **Bills & Items** - Individual bills with itemized purchases
- **Assignments** - Who owes what for each item
- **Payments** - Tracking of money transfers between users
- **Activities** - Audit trail of all hangout activities

## Security

All tables have Row Level Security (RLS) enabled with appropriate policies to ensure users can only access data they're authorized to see.

## Development

For local development and testing, see the `debug-scripts/` folder in the root directory for database connectivity and testing utilities.
