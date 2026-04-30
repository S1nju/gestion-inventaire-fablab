# Quick Reference Guide - Gestion d'Inventaire API

## 🚀 Getting Started

### 1. Run Migrations
```bash
php artisan migrate
```

### 2. Get Authentication Token
```bash
php artisan tinker
>>> $user = User::first();
>>> dd($user->createToken('api-token')->plainTextToken);
```

### 3. Test Endpoints
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8000/api/items
```

---

## 📚 Main Endpoints Quick Reference

### Items
```
GET    /api/items                    List items
POST   /api/items                    Create item
GET    /api/items/{id}               Get item
PUT    /api/items/{id}               Update item
DELETE /api/items/{id}               Delete item
```

### Item Movement (KEY FEATURE)
```
POST   /api/items/{id}/assign-to              Assign to person
POST   /api/items/{id}/transfer               Transfer to another person
POST   /api/items/{id}/return                 Return item
GET    /api/items/{id}/movement-history       View complete history
```

### Responsables (Staff)
```
GET    /api/responsables             List staff
POST   /api/responsables             Add staff
GET    /api/responsables/{id}        Get staff details
PUT    /api/responsables/{id}        Update staff
DELETE /api/responsables/{id}        Remove staff
GET    /api/responsables/{id}/current-items        Get their items
GET    /api/responsables/{id}/assignment-history   Get their history
```

### Organization Unit Items (NEW!)
```
GET    /api/facultes/{id}/items      Get all items in faculty
GET    /api/bureaus/{id}/items       Get all items in bureau
GET    /api/services/{id}/items      Get all items in service
```

### Organization Structure
```
GET/POST /api/facultes               Faculties
GET/POST /api/services               Services/Departments
GET/POST /api/bureaus                Offices/Bureaus
```

### Suppliers & Assignments
```
GET/POST /api/fournisseurs                   Suppliers
GET/POST /api/article-responsables           Assignments
```

---

## 🔍 Common Query Examples

### Create New Facility
```json
POST /api/facultes
{
  "nom": "Engineering",
  "doyen": "Dr. Smith",
  "email": "eng@uni.edu"
}
```

### Add Item to Inventory
```json
POST /api/items
{
  "nom": "Laptop Dell XPS",
  "description": "High performance laptop",
  "quantite": 5,
  "fournisseur_id": 1
}
```

### Assign Item to Staff Member
```json
POST /api/items/1/assign-to
{
  "responsable_id": 3,
  "quantite_affectee": 1,
  "notes": "Assigned to IT department"
}
```

### Transfer Item Between Staff
```json
POST /api/items/1/transfer
{
  "from_responsable_id": 3,
  "to_responsable_id": 5,
  "quantite_affectee": 1,
  "notes": "Transferred to maintenance"
}
```

### Return Item
```json
POST /api/items/1/return
{
  "responsable_id": 5,
  "notes": "Item returned in good condition"
}
```

### View Item History
```
GET /api/items/1/movement-history
```

### View Staff's Current Items
```
GET /api/responsables/3/current-items
```

### View Staff's Assignment History
```
GET /api/responsables/3/assignment-history
```

---

## 🗂️ Database Tables Quick Overview

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| items | Inventory items | nom, quantite, fournisseur_id |
| fournisseurs | Suppliers | nom, email, adresse |
| responsables | Staff members | nom, email, bureau_id, service_id |
| bureaus | Office locations | nom, localisation, faculte_id |
| facultes | Faculties | nom, doyen |
| services | Departments | nom, responsable_principal |
| article_responsables | Item assignments | article_id, responsable_id, date_affectation, date_retrait |
| item_movement_history | Audit trail | item_id, action_type, responsible_id, performed_by |

---

## 🎯 Key Relationships

```
Faculte (1-to-Many) ──→ Bureau
Bureau (1-to-Many) ──→ Responsable
Service (1-to-Many) ──→ Responsable
Fournisseur (1-to-Many) ──→ Item
Item (1-to-Many) ──→ ArticleResponsable
Responsable (1-to-Many) ──→ ArticleResponsable
Item (1-to-Many) ──→ ItemMovementHistory
```

---

## 🔐 Authentication

All endpoints require Bearer token:
```
Authorization: Bearer YOUR_TOKEN
```

---

## 📊 Key Features Summary

| Feature | Implementation |
|---------|-----------------|
| **Item Tracking** | ✅ Complete with history |
| **Movement Audit Trail** | ✅ ItemMovementHistory table |
| **Assignment Transfers** | ✅ Track from/to responsable |
| **Return Tracking** | ✅ date_retrait field |
| **Active/Historical Queries** | ✅ Scopes included |
| **Search & Filter** | ✅ All controllers support |
| **Pagination** | ✅ Default 15 items/page |
| **Relationships** | ✅ Full eager loading |
| **Data Integrity** | ✅ Foreign key constraints |

---

## 🎮 Common Workflows

### Workflow 1: New Item Gets Assigned
```
1. POST /api/items                    → Create item
2. POST /api/items/{id}/assign-to     → Assign to person
✓ Automatic movement history recorded
```

### Workflow 2: Transfer Item Between Staff
```
1. POST /api/items/{id}/transfer      → Transfer to new person
✓ Old assignment marked as returned
✓ New assignment created
✓ Complete audit trail maintained
```

### Workflow 3: Track Item's Complete Journey
```
1. GET /api/items/{id}/movement-history
✓ See all: assignments, transfers, returns
✓ Who did what and when
```

### Workflow 4: Audit Staff Inventory
```
1. GET /api/responsables/{id}/current-items
✓ See what they currently have
2. GET /api/responsables/{id}/assignment-history
✓ See complete history of movements
```

---

## 📋 Validation Rules

### Items
- **nom**: required, max 255 chars
- **quantite**: required, integer ≥ 0
- **fournisseur_id**: must exist in fournisseurs table

### Responsables
- **nom**: required, max 255 chars
- **email**: unique, valid email format

### Assignments
- **quantite_affectee**: required, integer ≥ 1
- **date_affectation**: required, valid date
- **date_retrait**: optional, valid date (only if returning)

---

## 🔧 Controller Usage

### In Your Custom Controller
```php
use App\Traits\TrackItemMovement;

class YourController extends Controller {
    use TrackItemMovement;
    
    public function yourMethod() {
        // Record movement
        $this->recordAssignment(
            itemId: 1,
            responsableId: 5,
            quantity: 1,
            notes: 'Note here',
            performedBy: auth()->id()
        );
    }
}
```

---

## 🐛 Common Errors & Solutions

### 404 Not Found
- Check if resource ID exists
- Verify you're using correct table relationships

### 422 Unprocessable Entity
- Check validation rules above
- Verify all required fields are present
- Check foreign key IDs exist

### 401 Unauthorized
- Add Bearer token to Authorization header
- Token might be expired, create new one

---

## 📱 Paginated Response Format
```json
{
  "success": true,
  "data": {
    "current_page": 1,
    "data": [
      { "id": 1, ... },
      { "id": 2, ... }
    ],
    "first_page_url": "...",
    "last_page": 5,
    "per_page": 15,
    "total": 75
  }
}
```

---

## 🎓 Learning Path

1. **Understand** the models: `app/Models/`
2. **Review** migrations: `database/migrations/`
3. **Check** relationships in models
4. **Test** CRUD endpoints first
5. **Explore** movement tracking features
6. **Deep dive** into your use cases

---

## 📞 Files Reference

- **Models**: `app/Models/*.php`
- **Controllers**: `app/Http/Controllers/*.php`
- **Migrations**: `database/migrations/*.php`
- **Routes**: `routes/api.php`
- **Trait**: `app/Traits/TrackItemMovement.php`
- **Full Docs**: `API_DOCUMENTATION.md`
- **Summary**: `IMPLEMENTATION_SUMMARY.md`

---

## ✅ Checklist Before Going Live

- [ ] All migrations run successfully
- [ ] Authentication tokens created
- [ ] All endpoints tested with valid data
- [ ] Search and filters working
- [ ] Movement tracking recording properly
- [ ] History queries returning correct data
- [ ] Pagination working
- [ ] Relationships eager-loaded
- [ ] Error handling working
- [ ] Performance acceptable

---

**Last Updated**: March 30, 2026
**Version**: 1.0 Complete
