# FarmSight 360 - Database Setup Guide

## 📋 **Prerequisites**

- PostgreSQL 14+ installed
- `psql` command-line tool
- Superuser access to PostgreSQL

---

## 🚀 **Quick Setup**

### **Step 1: Create Database**

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE farmsight360;

# Connect to the database
\c farmsight360

# Exit
\q
```

### **Step 2: Run Migrations**

```bash
# Navigate to project directory
cd /path/to/FarmSight-360-Yield-Workforce-Tracker

# Run initial schema
psql -U postgres -d farmsight360 -f migrations/001_initial_schema.sql

# Run seed data
psql -U postgres -d farmsight360 -f migrations/002_seed_data.sql
```

### **Step 3: Verify Setup**

```bash
# Connect to database
psql -U postgres -d farmsight360

# List all tables
\dt

# Check crops table
SELECT * FROM crops;

# Exit
\q
```

---

## 📊 **Database Schema Overview**

### **Domain: Authentication**
- `users` - User accounts

### **Domain: Farm Management**
- `farms` - Farm entities
- `fertilizers` - Fertilizer inventory
- `tools` - Equipment and tools

### **Domain: Crop Management**
- `crops` - Crop types (lookup)
- `yields` - Harvest records
- `sales` - Sales transactions
- `crop_inventory` - Current stock levels

### **Domain: Worker Management**
- `workers` - Farm workers
- `attendance` - Daily attendance
- `worker_transactions` - Advances/repayments
- `worker_payments` - Weekly settlements

### **Domain: Financial Tracking**
- `transactions` - All financial transactions

---

## 🔧 **Useful Commands**

### **View Table Structure**
```sql
\d users
\d farms
\d crops
```

### **Check Indexes**
```sql
\di
```

### **View Enums**
```sql
\dT
```

### **Drop Database (CAUTION!)**
```sql
DROP DATABASE farmsight360;
```

---

## 🗄️ **Connection String**

For backend configuration:

```
postgresql://postgres:password@localhost:5432/farmsight360
```

Update `password` with your PostgreSQL password.

---

## ✅ **Verification Checklist**

- [ ] Database created
- [ ] Schema migration successful
- [ ] Seed data loaded
- [ ] All tables exist
- [ ] Indexes created
- [ ] Enums defined
- [ ] Triggers working

---

## 🐛 **Troubleshooting**

### **Error: Database already exists**
```sql
DROP DATABASE farmsight360;
CREATE DATABASE farmsight360;
```

### **Error: Permission denied**
```bash
# Grant permissions
psql -U postgres
GRANT ALL PRIVILEGES ON DATABASE farmsight360 TO your_user;
```

### **Error: Enum already exists**
```sql
DROP TYPE IF EXISTS attendance_status CASCADE;
```

---

## 📝 **Next Steps**

After database setup:
1. Configure backend connection string
2. Test database connectivity
3. Start building APIs

---

**Database is ready for development!** 🎉
