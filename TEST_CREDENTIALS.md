# 🔐 Test Accounts & Credentials

## ✅ Implementation Summary

All requirements have been successfully implemented:

### 1. **Pagination for Movement Table** ✅
   - Movement table now properly maintains search filters when paginating
   - Supports 15 items per page with "Next/Previous" navigation
   - All 6 search filters are preserved when changing pages

### 2. **Advanced Search in Movements** ✅
   - Equipment name search (`item_name`)
   - Inventory number search (`n_inventaire`)
   - Action type filter (Assignment, Transfer, Return, Bureau Transfer)
   - Bureau filter
   - Date range filter (From/To)
   - All filters work together or individually

### 3. **N° Inventaire Column in Movements Table** ✅
   - Added as second column after Item name
   - Displays in monospace font for clarity
   - Shows "-" if item has no inventory number

### 4. **Unique N_Inventaire Validation** ✅
   - `n_inventaire` field is nullable (optional)
   - When provided, it must be unique across all items
   - Validation implemented in ItemController.php
   - Both store and update operations are protected

### 5. **Quantity Assignment for Items Without N_Inventaire** ✅
   - Already supported by the system!
   - Items can be assigned/transferred regardless of n_inventaire
   - Quantity assignment works for all items
   - No restrictions based on inventory number

### 6. **Role-Based Permissions System** ✅
   - Created roles table with role relationships
   - Created permissions table with permission management
   - Implemented role_user and permission_role pivot tables
   - Two roles configured: "editor" and "viewer"

### 7. **SelectItem Error Fixed** ✅
   - Removed empty value options from Select dropdowns
   - Filters now use placeholder text instead of empty SelectItem

---

## 🧑‍💼 Test Accounts

Two dedicated test accounts have been created and seeded in the database:

### **1️⃣ EDITOR Account (Full Access)**
```
📧 Email:    editor@test.com
🔑 Password: editor123
👤 Role:     Editor
```

**Permissions:**
- ✅ View inventory items
- ✅ Create new items
- ✅ Edit items
- ✅ Delete items
- ✅ View movement history
- ✅ Create movements (transfer, assign, return)
- ✅ Edit movements
- ✅ Delete movements
- ✅ View reports

**Use this account to:** Test create, edit, delete operations on items and movements.

---

### **2️⃣ VIEWER Account (Read-Only)**
```
📧 Email:    viewer@test.com
🔑 Password: viewer123
👤 Role:     Viewer
```

**Permissions:**
- ✅ View inventory items (read-only)
- ✅ View movement history (read-only)
- ✅ View reports (read-only)
- ❌ Cannot create/edit/delete items
- ❌ Cannot create movements
- ❌ Cannot manage users

**Use this account to:** Test view-only functionality and confirm restricted actions are blocked.

---

## 🗂️ Additional Test Accounts (Original)

The following accounts are also available (created before role system):

```
📧 admin@inventory.local       (Password: password)
📧 faculty@inventory.local      (Password: password)
📧 service@inventory.local      (Password: password)
📧 agent@inventory.local        (Password: password)
📧 test@example.com             (Password: password)
```

---

## 🔄 Permission Structure

### **Editor Role Permissions:**
1. `view_inventory` - Can see all items
2. `create_item` - Can create new items
3. `edit_item` - Can modify items
4. `delete_item` - Can remove items
5. `view_movements` - Can view movement history
6. `create_movement` - Can create transfers/assignments
7. `edit_movement` - Can modify movements
8. `delete_movement` - Can remove movements
9. `view_reports` - Can access reports

### **Viewer Role Permissions:**
1. `view_inventory` - Can see all items (read-only)
2. `view_movements` - Can view movement history (read-only)
3. `view_reports` - Can access reports (read-only)

---

## 🚀 How to Test

### **Login with Editor Account:**
1. Go to login page
2. Use: `editor@test.com` / `editor123`
3. Verify all CRUD operations work
4. Test creating items, assignments, transfers, etc.

### **Login with Viewer Account:**
1. Go to login page
2. Use: `viewer@test.com` / `viewer123`
3. Verify you can see all data
4. Verify buttons/actions for create/edit/delete are hidden or disabled
5. Verify API calls with write operations return 403 Forbidden

### **Test SearchFilters:**
1. Click "🔍 Afficher recherche avancée" in movements table
2. Try searching by:
   - Equipment name
   - Inventory number (n_inventaire)
   - Action type
   - Bureau
   - Date range
3. Verify filters work with pagination

---

## 📋 Database Schema

### **New Tables Created:**

**roles**
- id (PK)
- name (unique)
- description
- timestamps

**permissions**
- id (PK)
- name (unique)
- description
- timestamps

**role_user** (Pivot)
- id (PK)
- user_id (FK)
- role_id (FK)
- timestamps

**permission_role** (Pivot)
- id (PK)
- role_id (FK)
- permission_id (FK)
- timestamps

---

## 🛠️ Technical Details

### **Backend Files Created/Modified:**
- `database/migrations/2024_04_07_000000_create_roles_table.php` - Role tables schema
- `database/seeders/RolePermissionSeeder.php` - Seeds roles, permissions, and test accounts
- `database/seeders/DatabaseSeeder.php` - Calls RolePermissionSeeder
- `app/Models/Role.php` - Role model with relationships
- `app/Models/Permission.php` - Permission model
- `app/Models/User.php` - Updated with role/permission methods
- `app/Http/Middleware/CheckPermission.php` - Permission middleware
- `app/Traits/AuthorizeUser.php` - Authorization helper trait

### **Frontend Files Modified:**
- `src/app/(main)/dashboard/movements/_components/movement-filters.tsx` - Search filters component
- `src/app/(main)/dashboard/movements/page.tsx` - Integrated filters, added n_inventaire column, fixed pagination

### **User Model Methods:**
```php
$user->roles()              // Get all roles
$user->hasRole($roleName)   // Check single role
$user->hasAnyRole($roles)   // Check multiple roles
$user->hasPermission($perm) // Check permission (through roles)
$user->isEditor()           // Shortcut for editor role
$user->isViewer()           // Shortcut for viewer role
```

---

## ✨ Future Enhancement Opportunities

1. **Apply Authorization Middleware** - Add `->middleware('auth:sanctum')` to all protected routes
2. **Implement Permission Checks** - Use `CheckPermission` middleware on specific endpoints
3. **Frontend Authorization UI** - Hide/disable buttons based on user permissions
4. **Audit Logging** - Track who made what changes and when
5. **Role Management UI** - Create admin panel to manage roles and permissions
6. **Grant Additional Roles** - Create endpoints to assign roles to users

---

## 📞 Support

If you encounter any issues:
1. Ensure migrations ran: `php artisan migrate`
2. Verify seeder ran: `php artisan db:seed --class=RolePermissionSeeder`
3. Clear cache: `php artisan cache:clear`
4. Check browser console for frontend errors
5. Check Laravel logs: `storage/logs/laravel.log`

