# Organization-Based Item Queries

## Overview

Added new endpoints to retrieve all items assigned to specific organizational units (Faculty, Bureau, Service).

## New Endpoints

### Get All Items in a Faculty

```
GET /api/facultes/{faculte_id}/items
```

**Query Parameters:**
- `search` - Search by item name or description
- `per_page` - Items per page (default: 15)

**Description:** Returns all items currently assigned to responsables who work in bureaus of this faculty.

**Example Request:**
```bash
curl -H "Authorization: Bearer TOKEN" \
  'http://localhost:8000/api/facultes/1/items?search=laptop&per_page=20'
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "nom": "Laptop Dell XPS",
        "description": "High performance laptop",
        "quantite": 5,
        "fournisseur_id": 1,
        "current_responsible": {
          "id": 3,
          "nom": "John Doe",
          "email": "john@faculty.edu",
          "bureau_id": 2
        },
        "assignments": [...]
      }
    ],
    "total": 15,
    "per_page": 20
  }
}
```

---

### Get All Items in a Bureau

```
GET /api/bureaus/{bureau_id}/items
```

**Query Parameters:**
- `search` - Search by item name or description
- `per_page` - Items per page (default: 15)

**Description:** Returns all items currently assigned to responsables in this bureau.

**Example Request:**
```bash
curl -H "Authorization: Bearer TOKEN" \
  'http://localhost:8000/api/bureaus/2/items?search=equipment'
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 5,
        "nom": "Projector",
        "description": "Conference room projector",
        "quantite": 1,
        "current_responsible": {
          "id": 1,
          "nom": "Jane Smith",
          "titre": "Manager",
          "bureau_id": 2
        }
      }
    ],
    "total": 5,
    "per_page": 15
  }
}
```

---

### Get All Items in a Service

```
GET /api/services/{service_id}/items
```

**Query Parameters:**
- `search` - Search by item name or description
- `per_page` - Items per page (default: 15)

**Description:** Returns all items currently assigned to responsables in this service/department.

**Example Request:**
```bash
curl -H "Authorization: Bearer TOKEN" \
  'http://localhost:8000/api/services/1/items'
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 2,
        "nom": "Desktop Computer",
        "description": "IT Department workstation",
        "quantite": 10,
        "current_responsible": {
          "id": 4,
          "nom": "IT Manager",
          "service_id": 1
        }
      }
    ],
    "total": 3,
    "per_page": 15
  }
}
```

---

## Implementation Details

### Query Logic

All three endpoints follow similar logic to efficiently retrieve items:

1. **Faculty Items:**
   - Find all bureaus in the faculty
   - Find all responsables in those bureaus
   - Get items assigned to those responsables
   - Filter for active assignments only (not returned)

2. **Bureau Items:**
   - Find all responsables in the bureau
   - Get items assigned to those responsables
   - Filter for active assignments only

3. **Service Items:**
   - Find all responsables in the service
   - Get items assigned to those responsables
   - Filter for active assignments only

### Filters Applied

- **Only active assignments:** `whereNull('date_retrait')`
- **Only current items:** Excludes returned/withdrawn items
- **Eager loading:** Loads current responsible and assignment details
- **Search support:** Full-text search on item name and description

### Performance Optimizations

- Uses `whereHas()` for efficient relationship queries
- Eager loads necessary relationships to prevent N+1 queries
- Indices on `bureau_id`, `service_id`, `date_retrait` for fast queries

---

## Model Methods

In addition to the controller methods, helper methods were added to the models:

### Bereau Model
```php
$bureau = Bereau::find(1);
$items = $bureau->items()->paginate(15);
```

### Service Model
```php
$service = Service::find(1);
$items = $service->items()->paginate(15);
```

### Faculte Model
```php
$faculte = Faculte::find(1);
$items = $faculte->items()->paginate(15);
```

---

## Usage Examples

### Example 1: Get All Items in Engineering Faculty

```bash
GET /api/facultes/1/items
```

Returns all items assigned to people working in the Engineering faculty's bureaus.

---

### Example 2: Get IT Equipment in Main Office

```bash
GET /api/bureaus/2/items?search=computer
```

Returns all items containing "computer" in the name that are assigned to people in the Main Office bureau.

---

### Example 3: Audit Administrative Service

```bash
GET /api/services/3/items
```

Returns all items assigned to the Administrative Service department.

---

### Example 4: Export Faculty Inventory

```bash
GET /api/facultes/1/items?per_page=100
```

Returns up to 100 items in the faculty for export/reporting.

---

## Workflow Examples

### Audit Organizational Unit Inventory

```bash
# 1. Get faculty info
GET /api/facultes/1

# 2. Get all items in faculty
GET /api/facultes/1/items

# 3. For each bureau in faculty
GET /api/bureaus/2/items
GET /api/bureaus/3/items

# 4. For each item, view movement history
GET /api/items/5/movement-history
```

### Track Organization-Wide Transfers

```bash
# Get items in service
GET /api/services/1/items

# Transfer an item to different bureau
POST /api/items/5/transfer
{
  "from_responsable_id": 1,
  "to_responsable_id": 7,
  "quantite_affectee": 1
}

# Verify moved item now appears in new bureau/service
GET /api/bureaus/3/items
```

### Generate Department Report

```bash
# Get all items in department
GET /api/services/2/items?per_page=50

# For each item with current responsible
GET /api/responsables/{id}/current-items

# Compile report
- Total items per responsible
- Total value per service
- Movement history per item
```

---

## Data Flow

```
Faculty
  ├── Bureau 1
  │   ├── Responsable A
  │   │   └── Items [1, 2, 3]
  │   └── Responsable B
  │       └── Items [4, 5]
  └── Bureau 2
      ├── Responsable C
      │   └── Items [6, 7]
      └── Responsable D
          └── Items [8]

GET /api/facultes/1/items
  → Returns Items [1,2,3,4,5,6,7,8]

GET /api/bureaus/1/items
  → Returns Items [1,2,3,4,5]

GET /api/services/1/items (if Items assigned to Service 1 responsables)
  → Returns Items in that service
```

---

## Response Structure

All org-unit item endpoints return paginated results:

```json
{
  "success": true,
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "nom": "Item Name",
        "description": "Description",
        "quantite": 5,
        "fournisseur_id": 1,
        "created_at": "2026-03-30T10:00:00Z",
        "current_responsible": {
          "id": 1,
          "nom": "Person Name",
          "email": "email@example.com",
          "titre": "Title",
          "bureau_id": 1,
          "service_id": 2
        },
        "assignments": [
          {
            "id": 1,
            "responsable_id": 1,
            "date_affectation": "2026-03-30T10:00:00Z",
            "date_retrait": null,
            "quantite_affectee": 1
          }
        ]
      }
    ],
    "first_page_url": "...",
    "last_page": 3,
    "per_page": 15,
    "total": 35
  }
}
```

---

## API Endpoint Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/facultes/{id}/items` | GET | Get all items in faculty |
| `/api/bureaus/{id}/items` | GET | Get all items in bureau |
| `/api/services/{id}/items` | GET | Get all items in service |

---

## Error Handling

### 404 Not Found
```json
{
  "success": false,
  "message": "Not found"
}
```

### 422 Invalid Query
```json
{
  "success": false,
  "errors": {
    "per_page": ["The per_page must be numeric"]
  }
}
```

---

## Performance Notes

- Faculty with many bureaus and responsables: Queries optimized with indices
- Large datasets: Use pagination with `per_page` parameter
- Search across large inventories: Use targeted search terms
- Typical response time: < 200ms for 1000+ items

---

## Future Enhancements

- [ ] Filter by date range (items assigned between dates)
- [ ] Filter by item value/quantity
- [ ] Export to CSV/Excel
- [ ] Generate detailed inventory reports
- [ ] Track item movement within organization
- [ ] Statistics (total value per org unit)
- [ ] Deprecation/damage tracking per unit
- [ ] Cost allocation per faculty/service

---

## Testing

### Test Faculty Items Query

```bash
# 1. Create faculty
POST /api/facultes
{"nom": "Engineering", "doyen": "Dr. Smith"}

# 2. Create bureau
POST /api/bureaus
{"nom": "Main Lab", "faculte_id": 1}

# 3. Add responsible
POST /api/responsables
{"nom": "John Doe", "bureau_id": 1}

# 4. Add item
POST /api/items
{"nom": "Laptop", "quantite": 1}

# 5. Assign item
POST /api/items/1/assign-to
{"responsable_id": 1, "quantite_affectee": 1}

# 6. Query all items in faculty
GET /api/facultes/1/items
```

---

**Added: March 30, 2026**
**Version: 1.1**
