# Codebase Analysis - Inventory Management System

## 1. Item Model & n_inventaire Field

### Item Model ([app/Models/Item.php](app/Models/Item.php))
```php
protected $fillable = [
    'nom',
    'designation',
    'n_inventaire',      // Inventory number (unique, nullable)
    'n_decharge',        // Discharge/statement number (nullable)
    'description',
    'quantite',
    'bureau_id',         // Direct bureau assignment
    'fournisseur_id',    // Supplier reference
];
```

**Key Relationships:**
- `bureau()` - belongsTo Bereau (direct assignment)
- `fournisseur()` - belongsTo Fournisseur
- `responsables()` - belongsToMany through ArticleResponsable pivot with rich metadata
- `assignments()` - hasMany ArticleResponsable (all historical)
- `currentResponsible()` - hasOne ArticleResponsable (latest non-returned)
- `movementHistory()` - hasMany ItemMovementHistory (complete audit trail)

**Validation (store):**
```php
'nom' => 'required|string|max:255',
'designation' => 'nullable|string|max:255',
'n_inventaire' => 'nullable|string|max:255|unique:items',  // UNIQUE constraint
'n_decharge' => 'nullable|string|max:255',
'description' => 'nullable|string',
'quantite' => 'required|integer|min:0',
'bureau_id' => 'nullable|exists:bureaus,id',
'fournisseur_id' => 'nullable|exists:fournisseurs,id',
```

**Items Table Migration:** [2026_03_30_000003_create_items_table.php](database/migrations/2026_03_30_000003_create_items_table.php)
- `id` (PK)
- `nom` (string)
- `designation` (string, nullable)
- `n_inventaire` (string, unique, nullable) - **INDEXED**
- `n_decharge` (string, nullable) - **INDEXED**
- `description` (text, nullable)
- `quantite` (integer, default 0)
- `fournisseur_id` (FK → fournisseurs, set null on delete) - **INDEXED**
- `bureau_id` (FK → bureaus, cascade on delete) - Added in [2026_04_05_120000_add_bureau_id_to_items_table.php](database/migrations/2026_04_05_120000_add_bureau_id_to_items_table.php) - **INDEXED**
- `created_at`, `updated_at`

---

## 2. User & Auth System

### User Model ([app/Models/User.php](app/Models/User.php))

**Auth Setup:**
- Uses **Laravel Sanctum** for API token authentication
- Uses **HasApiTokens** trait for token management
- Password hashing with BCRYPT (rounds: 12)
- Email verification optional

**Fillable Attributes:**
```php
#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
```

**Casts:**
- `email_verified_at` → datetime
- `password` → hashed (automatically hashed via mutator)

**Users Table Migration:** [0001_01_01_000000_create_users_table.php](database/migrations/0001_01_01_000000_create_users_table.php)
- `id` (PK)
- `name` (string)
- `email` (string, unique)
- `email_verified_at` (timestamp, nullable)
- `password` (string, hashed)
- `remember_token` (string, nullable)
- `created_at`, `updated_at`

**Additional Tables:**
- `password_reset_tokens` - Email-based password reset
- `sessions` - Session storage
- `personal_access_tokens` - Sanctum API tokens

### Auth Configuration ([config/sanctum.php](config/sanctum.php))

**Stateful Domains:**
- localhost, 127.0.0.1, ::1
- Ports: 3000, 3001, 3002, 8000
- Frontend URL: http://localhost:3000

**Guard:** web
**Expiration:** null (tokens don't expire by default)
**Token Prefix:** Configurable via env

### Authentication Endpoints

**Login:** [POST /api/login](routes/api.php)
```php
Route::post('/login', [AuthenticatedSessionController::class, 'apiStore'])
    ->withoutMiddleware([
        \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
    ]);
```

**Auth Controller:** [app/Http/Controllers/Auth/AuthenticatedSessionController.php](app/Http/Controllers/Auth/AuthenticatedSessionController.php)
- `apiStore()` - API login (returns token)
- `store()` - Web login (session-based)
- `destroy()` - Logout (invalidates tokens/sessions)

**Validation:**
- `email` - required, email format
- `password` - required, string

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "plaintext_token",
  "user": {
    "id": 1,
    "name": "Admin",
    "email": "admin@inventory.local"
  }
}
```

**Protected Routes Middleware:**
```php
Route::middleware(['auth:sanctum'])->group(...)
```

### Seeded Users ([database/seeders/DatabaseSeeder.php](database/seeders/DatabaseSeeder.php))
```php
$users = [
    ['name' => 'Inventory Admin', 'email' => 'admin@inventory.local', 'password' => 'password'],
    ['name' => 'Faculty Manager', 'email' => 'faculty@inventory.local', 'password' => 'password'],
    ['name' => 'Service Responsable', 'email' => 'service@inventory.local', 'password' => 'password'],
    ['name' => 'Bureau Agent', 'email' => 'agent@inventory.local', 'password' => 'password'],
    ['name' => 'Test User', 'email' => 'test@example.com', 'password' => 'password'],
];
// + 5 factory-generated users
```

**Note:** NO ROLE/PERMISSION SYSTEM CURRENTLY IMPLEMENTED. Auth is basic (all authenticated users have same access).

---

## 3. Item Assignment & Transfer Logic (Affecter)

### ArticleResponsable Model ([app/Models/ArticleResponsable.php](app/Models/ArticleResponsable.php))

**Pivot Table** connecting Items ↔ Responsables with rich metadata.

**Fillable Attributes:**
```php
protected $fillable = [
    'article_id',           // FK → items
    'responsable_id',       // FK → responsables (current holder)
    'date_affectation',     // Assignment date
    'date_retrait',         // Return date (null = active)
    'responsable_id_from',  // FK → responsables (previous holder for transfers)
    'quantite_affectee',    // Quantity assigned (default 1)
    'notes',                // Assignment notes
];
```

**Relationships:**
- `item()` - belongsTo Item
- `responsable()` - belongsTo Responsable (current)
- `transferredFrom()` - belongsTo Responsable (previous)

**Scopes:**
- `active()` - whereNull('date_retrait')
- `historical()` - whereNotNull('date_retrait')
- `latest()` - orderBy('date_affectation', 'desc')

**ArticleResponsables Table:** [2026_03_30_000001_create_article_responsables_table.php](database/migrations/2026_03_30_000001_create_article_responsables_table.php)
- `id` (PK)
- `article_id` (FK → items, cascade) - **INDEXED**
- `responsable_id` (FK → responsables, cascade) - **INDEXED**
- `date_affectation` (datetime, nullable)
- `date_retrait` (datetime, nullable) - **INDEXED** (for filtering active assignments)
- `responsable_id_from` (FK → responsables, set null)
- `quantite_affectee` (integer, default 1)
- `notes` (text, nullable)
- `created_at`, `updated_at`
- **Unique Constraint:** [`article_id`, `responsable_id`, `date_affectation`]

### Assignment Flow

#### 1. Assign Item to Responsible
**Endpoint:** [POST /api/items/{item}/assign-to](routes/api.php)
**Controller:** [ItemMovementController::assignItem()](app/Http/Controllers/ItemMovementController.php)

```php
POST /api/items/1/assign-to
{
    "responsable_id": 5,
    "quantite_affectee": 1,
    "notes": "Initial assignment"
}

Response:
{
    "success": true,
    "message": "Item assigned successfully",
    "data": {
        "id": 1,
        "article_id": 1,
        "responsable_id": 5,
        "date_affectation": "2026-04-07T10:30:00Z",
        "quantite_affectee": 1,
        ...
    }
}
```

**Logic:**
1. Create ArticleResponsable record with null `date_retrait` (active)
2. Record in ItemMovementHistory with action_type = 'assignment'

#### 2. Transfer Item Between Responsables
**Endpoint:** [POST /api/items/{item}/transfer](routes/api.php)
**Controller:** [ItemMovementController::transferItem()](app/Http/Controllers/ItemMovementController.php)

```php
POST /api/items/1/transfer
{
    "from_responsable_id": 5,
    "to_responsable_id": 10,
    "quantite_affectee": 1,
    "notes": "Transfer to different department"
}
```

**Logic:**
1. Verify current assignment exists and has sufficient quantity
2. **If full transfer:** Mark old assignment with `date_retrait = now()`
3. **If partial transfer:** Decrement old assignment quantity (`decrement('quantite_affectee', quantity)`)
4. **Create new assignment** with:
   - `responsable_id_from = previous_responsable_id` (tracks transfer source)
   - `date_affectation = now()`
   - `date_retrait = null` (active)
5. Record in ItemMovementHistory with action_type = 'transfer'

#### 3. Transfer Item Between Bureaus
**Endpoint:** [POST /api/items/{item}/transfer-bureau](routes/api.php)
**Controller:** [ItemMovementController::transferItemBetweenBureaus()](app/Http/Controllers/ItemMovementController.php)

```php
POST /api/items/1/transfer-bureau
{
    "from_bureau_id": 1,
    "to_bureau_id": 2,
    "notes": "Moving office"
}
```

**Logic:**
1. Verify item currently assigned to source bureau
2. Update item.bureau_id
3. Record transfer in ItemMovementHistory with action_type = 'bureau_transfer'

#### 4. Return Item from Responsible
**Endpoint:** [POST /api/items/{item}/return](routes/api.php)
**Controller:** [ItemMovementController::returnItem()](app/Http/Controllers/ItemMovementController.php)

```php
POST /api/items/1/return
{
    "responsable_id": 5,
    "notes": "Item returned in good condition"
}
```

**Logic:**
1. Find active assignment (whereNull('date_retrait'))
2. Set `date_retrait = now()`
3. Record in ItemMovementHistory with action_type = 'return'

### ItemMovementHistory Model ([app/Models/ItemMovementHistory.php](app/Models/ItemMovementHistory.php))

**Complete audit trail for all item movements.**

**Fillable:**
```php
protected $fillable = [
    'item_id',                  // FK → items
    'article_responsable_id',   // FK → article_responsables (optional reference)
    'responsible_id',           // FK → responsables (item moved TO)
    'previous_responsible_id',  // FK → responsables (item moved FROM)
    'action_type',              // 'assignment', 'transfer', 'return', 'damage', 'loss', 'bureau_transfer'
    'quantity',                 // Quantity involved
    'notes',                    // Action notes
    'performed_by',             // FK → users (who performed action)
];
```

**Relationships:**
- `item()` - belongsTo Item
- `articleResponsable()` - belongsTo ArticleResponsable
- `responsible()` - belongsTo Responsable (TO)
- `previousResponsible()` - belongsTo Responsable (FROM)
- `performer()` - belongsTo User

**Scopes:**
- `byType($type)` - where('action_type', $type)
- `recent($days = 7)` - where('created_at', '>=', now()->subDays($days))

**ItemMovementHistory Table:** [2026_03_30_000002_create_item_movement_history_table.php](database/migrations/2026_03_30_000002_create_item_movement_history_table.php)
- `id` (PK)
- `item_id` (FK → items, cascade) - **INDEXED**
- `article_responsable_id` (FK → article_responsables, set null)
- `responsible_id` (FK → responsables, set null) - **INDEXED**
- `previous_responsible_id` (FK → responsables, set null)
- `action_type` (string, default 'assignment') - **INDEXED**
- `quantity` (integer, default 1)
- `notes` (text, nullable)
- `performed_by` (FK → users, set null)
- `created_at`, `updated_at` - **INDEXED on created_at**

### TrackItemMovement Trait ([app/Traits/TrackItemMovement.php](app/Traits/TrackItemMovement.php))

Helper trait used by ItemMovementController:
- `recordAssignment()` - Creates ItemMovementHistory for assignment/transfer
- `recordReturn()` - Records item return
- `recordDamageOrLoss()` - Records damage/loss with type ('damage' or 'loss')
- `getItemMovementHistory()` - Fetch complete history for item
- `getCurrentItemsForResponsable()` - Get current items held by person

---

## 4. Organizational Hierarchy

### Responsable Model ([app/Models/Responsable.php](app/Models/Responsable.php))

**Person/Individual responsible for items**

**Fillable:**
```php
protected $fillable = [
    'nom',          // Name (required)
    'email',        // Email (unique, nullable)
    'telephone',    // Phone (nullable)
    'titre',        // Title/Position (nullable)
    'bureau_id',    // FK → bureaus (nullable)
    'service_id',   // FK → services (nullable)
];
```

**Relationships:**
- `bureau()` - belongsTo Bereau
- `service()` - belongsTo Service
- `items()` - belongsToMany Item through ArticleResponsable
- `currentItems()` - hasMany ArticleResponsable (whereNull date_retrait)
- `assignmentRecords()` - hasMany ArticleResponsable
- `transferredItems()` - hasMany ArticleResponsable (as responsable_id_from)
- `movementHistory()` - hasMany ItemMovementHistory

**Responsables Table:** [2026_03_30_000008_create_responsables_table.php](database/migrations/2026_03_30_000008_create_responsables_table.php)
- `id` (PK)
- `nom` (string)
- `email` (string, unique, nullable)
- `telephone` (string, nullable)
- `titre` (string, nullable)
- `bureau_id` (FK → bureaus, set null) - **INDEXED**
- `service_id` (FK → services, set null) - **INDEXED**
- `created_at`, `updated_at`

### Bereau Model ([app/Models/Bereau.php](app/Models/Bereau.php))

**Office/Bureau** (organizational unit)

**Fillable:**
```php
protected $fillable = [
    'nom',
    'description',
    'localisation',
    'service_id',  // Added in migration
];
```

**Relationships:**
- `service()` - belongsTo Service
- `faculte()` - hasOneThrough Faculty
- `responsables()` - hasMany Responsable
- `items()` - Items in this bureau

**Bureaus Table:** [2026_03_30_000005_create_bureaus_table.php](database/migrations/2026_03_30_000005_create_bureaus_table.php)
- `id` (PK)
- `nom` (string)
- `description` (text, nullable)
- `localisation` (string, nullable)
- `faculte_id` (FK → facultes, set null) - **deprecated, use service.faculte_id**
- `service_id` (FK → services, set null) - Added in [2026_03_30_140000_add_hierarchy_columns_for_services_and_bureaus.php](database/migrations/2026_03_30_140000_add_hierarchy_columns_for_services_and_bureaus.php) - **INDEXED**
- `created_at`, `updated_at`

### Service Model ([app/Models/Service.php](app/Models/Service.php))

**Department/Service** (organizational unit)

**Fillable:**
```php
protected $fillable = [
    'nom',
    'description',
    'responsable_principal',
    'faculte_id',  // Added in migration
];
```

**Relationships:**
- `faculte()` - belongsTo Faculte
- `bureaus()` - hasMany Bereau
- `responsables()` - hasMany Responsable
- `items()` - Items in bureaus of this service

**Services Table:** [2026_03_30_000007_create_services_table.php](database/migrations/2026_03_30_000007_create_services_table.php)
- `id` (PK)
- `nom` (string)
- `description` (text, nullable)
- `responsable_principal` (string, nullable)
- `faculte_id` (FK → facultes, set null) - Added in [2026_03_30_140000_add_hierarchy_columns_for_services_and_bureaus.php](database/migrations/2026_03_30_140000_add_hierarchy_columns_for_services_and_bureaus.php) - **INDEXED**
- `created_at`, `updated_at`

### Faculte Model ([app/Models/Faculte.php](app/Models/Faculte.php))

**Faculty/College** (top-level organizational unit)

**Fillable:**
```php
protected $fillable = [
    'nom',
    'description',
    'doyen',   // Dean name
    'email',
];
```

**Relationships:**
- `services()` - hasMany Service
- `bureaus()` - hasManyThrough Bereau (via Service)
- `items()` - Items in bureaus of this faculty

**Facultes Table:** [2026_03_30_000006_create_facultes_table.php](database/migrations/2026_03_30_000006_create_facultes_table.php)
- `id` (PK)
- `nom` (string)
- `description` (text, nullable)
- `doyen` (string, nullable)
- `email` (string, nullable)
- `created_at`, `updated_at`

### Hierarchy Structure
```
Faculte (Faculty)
  └── Service(s) (Department)
      └── Bureau(s) (Office)
          └── Responsable(s) (Person in charge)
              └── Item(s) (Inventory)
```

### Fournisseur Model ([app/Models/Fournisseur.php](app/Models/Fournisseur.php))

**Supplier**

**Fillable:**
```php
protected $fillable = [
    'nom',
    'email',
    'telephone',
    'adresse',
    'ville',
    'code_postal',
    'pays',
];
```

**Relationships:**
- `items()` - hasMany Item

---

## 5. API Routes Summary

All routes require `auth:sanctum` middleware (authenticated API token) except login.

### Authentication
- `POST /api/login` - Login (no auth required)
- `GET /api/user` - Get current user (auth required)

### Items CRUD
- `GET /api/items` - List items (filters: fournisseur_id, n_inventaire, bureau_id, service_id, faculte_id, search)
- `POST /api/items` - Create item
- `GET /api/items/{item}` - Show item with full relations
- `PUT /api/items/{item}` - Update item
- `DELETE /api/items/{item}` - Delete item
- `GET /api/bureaus/{bureau}/items` - Items by bureau
- `GET /api/services/{service}/items` - Items by service
- `GET /api/facultes/{faculte}/items` - Items by faculty

### Item Movement & Tracking
- `POST /api/items/{item}/assign-to` - Assign to responsible person
- `POST /api/items/{item}/transfer` - Transfer between responsables
- `POST /api/items/{item}/transfer-bureau` - Transfer between bureaus
- `POST /api/items/{item}/return` - Return item
- `GET /api/items/{item}/movement-history` - Item's movement history
- `GET /api/item-movements` - Global movement history (filters: action_type, item_id, item_name, n_inventaire, bureau_id, from_date, to_date)

### Responsables
- `GET /api/responsables` - List (filters: bureau_id, service_id, search)
- `POST /api/responsables` - Create
- `GET /api/responsables/{responsable}` - Show with current items & history
- `PUT /api/responsables/{responsable}` - Update
- `DELETE /api/responsables/{responsable}` - Delete
- `GET /api/responsables/{responsable}/current-items` - Current items assigned
- `GET /api/responsables/{responsable}/assignment-history` - Full assignment history

### Bureaus
- `GET /api/bureaus` - List
- `POST /api/bureaus` - Create
- `GET /api/bureaus/{bureau}` - Show
- `PUT /api/bureaus/{bureau}` - Update
- `DELETE /api/bureaus/{bureau}` - Delete
- `GET /api/bureaus/{bureau}/items` - Bureau items

### Services
- `GET /api/services` - List
- `POST /api/services` - Create
- `GET /api/services/{service}` - Show
- `PUT /api/services/{service}` - Update
- `DELETE /api/services/{service}` - Delete
- `GET /api/services/{service}/items` - Service items

### Facultes
- `GET /api/facultes` - List
- `POST /api/facultes` - Create
- `GET /api/facultes/{faculte}` - Show
- `PUT /api/facultes/{faculte}` - Update
- `DELETE /api/facultes/{faculte}` - Delete
- `GET /api/facultes/{faculte}/items` - Faculty items

### Fournisseurs
- `GET /api/fournisseurs` - List
- `POST /api/fournisseurs` - Create
- `GET /api/fournisseurs/{fournisseur}` - Show
- `PUT /api/fournisseurs/{fournisseur}` - Update
- `DELETE /api/fournisseurs/{fournisseur}` - Delete

### ArticleResponsables
- `GET /api/article-responsables` - List (filters: active, historical)
- `POST /api/article-responsables` - Create
- `GET /api/article-responsables/{articleResponsable}` - Show
- `PUT /api/article-responsables/{articleResponsable}` - Update
- `DELETE /api/article-responsables/{articleResponsable}` - Delete

---

## 6. Database Configuration

**Driver:** SQLite (development)
**Location:** storage/database.sqlite

**Tables Overview:**
```
users
├── id (PK)
├── name
├── email (unique)
├── password (hashed)
└── timestamps

personal_access_tokens (Sanctum)
├── id (PK)
├── tokenable_id (user_id)
├── tokenable_type ('User')
├── name
├── token (unique, hashed)
├── abilities (JSON)
└── timestamps

facultes
├── id (PK)
├── nom
├── description
├── doyen
├── email
└── timestamps

services
├── id (PK)
├── nom
├── description
├── responsable_principal
├── faculte_id (FK)
└── timestamps

bureaus
├── id (PK)
├── nom
├── description
├── localisation
├── faculte_id (FK, deprecated)
├── service_id (FK, preferred)
└── timestamps

responsables
├── id (PK)
├── nom
├── email (unique)
├── telephone
├── titre
├── bureau_id (FK)
├── service_id (FK)
└── timestamps

fournisseurs
├── id (PK)
├── nom
├── email (unique)
├── telephone
├── adresse
├── ville
├── code_postal
├── pays
└── timestamps

items
├── id (PK)
├── nom
├── designation
├── n_inventaire (unique, INDEXED)
├── n_decharge
├── description
├── quantite
├── bureau_id (FK, INDEXED)
├── fournisseur_id (FK, INDEXED)
└── timestamps

article_responsables (Pivot + Audit)
├── id (PK)
├── article_id (FK, INDEXED)
├── responsable_id (FK, INDEXED)
├── date_affectation
├── date_retrait (INDEXED, null = active)
├── responsable_id_from (FK)
├── quantite_affectee (integer)
├── notes
└── timestamps
└── UNIQUE(article_id, responsable_id, date_affectation)

item_movement_history (Audit Trail)
├── id (PK)
├── item_id (FK, INDEXED)
├── article_responsable_id (FK)
├── responsible_id (FK, INDEXED)
├── previous_responsible_id (FK)
├── action_type (string, INDEXED)
├── quantity
├── notes
├── performed_by (FK, INDEXED)
└── timestamps
```

---

## 7. Key Design Patterns & Features

### Assignment Pattern (ArticleResponsable + ItemMovementHistory)
- **Dual tracking:** ArticleResponsable for current state, ItemMovementHistory for audit trail
- **Soft deletes:** Items marked as returned (date_retrait set) rather than deleted
- **Quantity support:** Partial transfers possible by managing quantite_affectee
- **Transfer tracking:** responsable_id_from tracks who transferred FROM
- **Multi-level tracking:** Bureau, Service, Faculty levels with hierarchical queries

### Active vs Historical Data
```php
// Get active assignments only
$active = ArticleResponsable::active()->get();  // whereNull('date_retrait')

// Get historical
$history = ArticleResponsable::historical()->get();  // whereNotNull('date_retrait')
```

### Search & Filter Capabilities
```php
// Items with advanced filtering
GET /api/items?n_inventaire=INV-001&bureau_id=1&search=laptop
GET /api/item-movements?action_type=transfer&from_date=2026-04-01&to_date=2026-04-07
```

### User Tracking
- `performed_by` field records which user performed each movement
- ItemMovementHistory.performer() relationship shows the user

### Relationships with Pivot Data
```php
// Rich pivot data via withPivot()
$item->responsables()->get();  // Includes assignment details

$responsible->items()->get();  // With date_affectation, date_retrait, etc.
```

---

## 8. Important Notes & Limitations

### NO Role/Permission System
- All authenticated users have full API access
- No authorization checks (only is_authenticated checks via `auth:sanctum`)
- **Recommendation:** Add Laravel Spatie Permissions or similar for role-based access control

### Unique Constraint on n_inventaire
- Per item table migration: `$table->string('n_inventaire')->nullable()->unique()`
- Allows multiple NULL values (SQLite behavior)
- Good practice for business requirements

### No Soft Deletes
- Deleted records are permanently removed
- No recovery mechanism
- **Recommendation:** Add SoftDeletes trait to models if needed

### No Timestamps on Some Models
- Item assignments and movements properly tracked with timestamps
- All key tables have created_at/updated_at

### Assignment History Unique Constraint
```php
$table->unique(['article_id', 'responsable_id', 'date_affectation']);
```
- Prevents duplicate assignments on same date
- Allows re-assignment after return (different date_affectation)

### Database
- Using SQLite (development-friendly)
- All migrations are reversible with down() methods
- Proper foreign key constraints with cascade/set null delete options

---

## Summary Statistics

| Component | Count |
|-----------|-------|
| Models | 8 |
| Controllers | 8 |
| Migrations | 15 |
| Database Tables | 12 |
| API Routes | 60+ |
| Traits | 1 |

**Key Files:**
- [app/Models/](app/Models/) - 9 models
- [app/Http/Controllers/](app/Http/Controllers/) - 8 controllers
- [database/migrations/](database/migrations/) - 15 migrations
- [routes/api.php](routes/api.php) - REST API endpoint definitions
- [config/sanctum.php](config/sanctum.php) - API auth configuration
