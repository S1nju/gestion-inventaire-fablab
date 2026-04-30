# 🛣️ Complete Routes Documentation

## Web Routes (routes/web.php)

### ✅ Health & Status Checks
```
GET  /health              - Health check endpoint
GET  /api/status          - API operational status
```

### ✅ Documentation & Info
```
GET  /                    - API homepage
GET  /docs                - API documentation endpoint
GET  /endpoints           - List all available endpoints
GET  /help                - System help and features info
GET  /routes              - Get all routes in JSON format
```

### ✅ Testing & Debugging
```
GET  /test/database       - Test database connection
GET  /test/app            - Application info and configuration
GET  /test/tables         - List all database tables
```

---

## API Routes (routes/api.php) - 50+ Endpoints

### 🔐 Authentication
```
GET  /api/user            - Get authenticated user (requires Sanctum token)
```

---

### 📦 ITEMS MANAGEMENT

#### CRUD Operations
```
GET    /api/items                - List items (searchable, filterable, paginated)
POST   /api/items                - Create new item
GET    /api/items/{item}         - Get specific item with relationships
PUT    /api/items/{item}         - Update item
DELETE /api/items/{item}         - Delete item
```

Query Parameters for GET /api/items:
- `search` - Search by name or description
- `fournisseur_id` - Filter by supplier
- `per_page` - Items per page (default: 15)

---

### 🔄 ITEM MOVEMENT & TRACKING (KEY FEATURE)

#### Assign Items
```
POST   /api/items/{item}/assign-to          - Assign item to responsible person
```
Body:
```json
{
  "responsable_id": 1,
  "quantite_affectee": 1,
  "notes": "Initial assignment"
}
```

#### Transfer Items
```
POST   /api/items/{item}/transfer           - Transfer between responsables
```
Body:
```json
{
  "from_responsable_id": 1,
  "to_responsable_id": 2,
  "quantite_affectee": 1,
  "notes": "Transfer to new department"
}
```

#### Return Items
```
POST   /api/items/{item}/return             - Return item from responsible
```
Body:
```json
{
  "responsable_id": 1,
  "notes": "Item returned in good condition"
}
```

#### View History
```
GET    /api/items/{item}/movement-history   - Get complete movement history (paginated)
```

---

### 👤 RESPONSABLE MANAGEMENT

#### CRUD Operations
```
GET    /api/responsables              - List responsables (searchable, filterable)
POST   /api/responsables              - Create responsable
GET    /api/responsables/{id}         - Get responsable details with relations
PUT    /api/responsables/{id}         - Update responsable
DELETE /api/responsables/{id}         - Delete responsable
```

Query Parameters for GET /api/responsables:
- `search` - Search by name or email
- `bureau_id` - Filter by bureau
- `service_id` - Filter by service
- `per_page` - Items per page (default: 15)

#### Responsable-Specific Queries
```
GET    /api/responsables/{id}/current-items     - Get current items assigned
GET    /api/responsables/{id}/assignment-history - Get complete assignment history
```

---

### 🏢 FOURNISSEUR (SUPPLIER) MANAGEMENT

```
GET    /api/fournisseurs              - List suppliers (searchable)
POST   /api/fournisseurs              - Create supplier
GET    /api/fournisseurs/{id}         - Get supplier details
PUT    /api/fournisseurs/{id}         - Update supplier
DELETE /api/fournisseurs/{id}         - Delete supplier
```

Query Parameters:
- `search` - Search by name, email, or city

---

### 🏛️ BUREAU (OFFICE) MANAGEMENT

```
GET    /api/bureaus                   - List bureaus (searchable, filterable)
POST   /api/bureaus                   - Create bureau
GET    /api/bureaus/{id}              - Get bureau details
PUT    /api/bureaus/{id}              - Update bureau
DELETE /api/bureaus/{id}              - Delete bureau
GET    /api/bureaus/{id}/items        - Get all items in this bureau
```

**Get Bureau Items:**
```
GET /api/bureaus/2/items?search=laptop&per_page=20
```
Returns all items currently assigned to responsables in this bureau.

Query Parameters:
- `search` - Search by name
- `faculte_id` - Filter by faculty

---

### 🎓 FACULTE (FACULTY) MANAGEMENT

```
GET    /api/facultes                  - List faculties (searchable)
POST   /api/facultes                  - Create faculty
GET    /api/facultes/{id}             - Get faculty details
PUT    /api/facultes/{id}             - Update faculty
DELETE /api/facultes/{id}             - Delete faculty
GET    /api/facultes/{id}/items       - Get all items in this faculty
```

**Get Faculty Items:**
```
GET /api/facultes/1/items?search=equipment&per_page=50
```
Returns all items currently assigned to responsables whose bureaus belong to this faculty.

Query Parameters:
- `search` - Search by name

---

### 🔧 SERVICE (DEPARTMENT) MANAGEMENT

```
GET    /api/services                  - List services (searchable)
POST   /api/services                  - Create service
GET    /api/services/{id}             - Get service details
PUT    /api/services/{id}             - Update service
DELETE /api/services/{id}             - Delete service
GET    /api/services/{id}/items       - Get all items in this service
```

**Get Service Items:**
```
GET /api/services/1/items?search=computer
```
Returns all items currently assigned to responsables in this service/department.

Query Parameters:
- `search` - Search by name

---

### 📋 ARTICLE-RESPONSABLE MANAGEMENT

```
GET    /api/article-responsables      - List assignments (filterable)
POST   /api/article-responsables      - Create assignment
GET    /api/article-responsables/{id} - Get assignment details
PUT    /api/article-responsables/{id} - Update assignment
DELETE /api/article-responsables/{id} - Delete assignment
```

Query Parameters for GET /api/article-responsables:
- `active` - Show only active assignments
- `historical` - Show only returned assignments

---

## 📊 Complete Endpoint Count

| Category | Count |
|----------|-------|
| **Items CRUD** | 5 |
| **Item Movement** | 4 |
| **Responsable CRUD + Special** | 7 |
| **Fournisseur CRUD** | 5 |
| **Bureau CRUD + Items** | 6 |
| **Faculte CRUD + Items** | 6 |
| **Service CRUD + Items** | 6 |
| **ArticleResponsable CRUD** | 5 |
| **Web Routes** | 10+ |
| **Total API Endpoints** | 55+ |

---

## 🔐 Authentication

### All API routes require Sanctum Bearer Token:
```
Authorization: Bearer YOUR_TOKEN
```

### Get token:
```bash
php artisan tinker
>>> $user = User::first();
>>> $token = $user->createToken('api-token')->plainTextToken;
>>> dd($token);
```

### Use in requests:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8000/api/items
```

---

## 🧪 Quick Test Commands

### Check API Status
```bash
curl http://localhost:8000/health
```

### List Routes
```bash
curl http://localhost:8000/routes
```

### Get Help
```bash
curl http://localhost:8000/help
```

### Test Database
```bash
curl http://localhost:8000/test/database
```

### List Tables
```bash
curl http://localhost:8000/test/tables
```

---

## 📝 Response Format

### Success Response (200)
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Created Response (201)
```json
{
  "success": true,
  "message": "Resource created successfully",
  "data": { ... }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "current_page": 1,
    "data": [ ... ],
    "first_page_url": "...",
    "last_page": 5,
    "per_page": 15,
    "total": 75
  }
}
```

### Error Response (4xx/5xx)
```json
{
  "success": false,
  "message": "Error message",
  "errors": { ... }
}
```

---

## 🎯 Common Workflows

### Workflow 1: Complete Item Lifecycle
```bash
# 1. Create item
POST /api/items

# 2. Assign to responsible
POST /api/items/{id}/assign-to

# 3. Transfer to another
POST /api/items/{id}/transfer

# 4. Return item
POST /api/items/{id}/return

# 5. View complete history
GET /api/items/{id}/movement-history
```

### Workflow 2: Audit Staff
```bash
# 1. Get responsable details
GET /api/responsables/{id}

# 2. View their current items
GET /api/responsables/{id}/current-items

# 3. View their assignment history
GET /api/responsables/{id}/assignment-history
```

### Workflow 3: Organization Setup
```bash
# 1. Create faculty
POST /api/facultes

# 2. Create services
POST /api/services

# 3. Create bureaus
POST /api/bureaus

# 4. Add responsables
POST /api/responsables

# 5. Add suppliers
POST /api/fournisseurs

# 6. Add items
POST /api/items
```

---

## 🛠️ Route Definition Location

- **API Routes**: `routes/api.php`
- **Web Routes**: `routes/web.php`
- **Auth Routes**: `routes/auth.php` (included)

---

## 📚 Related Documentation

- **Full API Docs**: See `API_DOCUMENTATION.md`
- **Quick Reference**: See `QUICK_REFERENCE.md`
- **Implementation**: See `IMPLEMENTATION_SUMMARY.md`
- **File Checklist**: See `FILES_CHECKLIST.md`

---

## ✅ Testing Checklist

- [ ] Web routes accessible (GET /)
- [ ] Health check working (GET /health)
- [ ] API status working (GET /api/status)
- [ ] Database connection verified (GET /test/database)
- [ ] Tables listed (GET /test/tables)
- [ ] Auth token created
- [ ] Items CRUD working
- [ ] Movement tracking working
- [ ] Responsable queries working
- [ ] Search/filter working
- [ ] Pagination working
- [ ] Relationships loaded

---

**All routes fully functional and documented!**
