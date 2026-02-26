# Unit Ledger Implementation Plan

## Overview

**Current behavior:** When a transaction has `to_owner_id` (client/company), it always saves to the owner's general ledger. The optional `unit_id` field exists but both from_owner and to_owner ledger entries get it, and the ledger view doesn't filter by unit.

**Desired behavior:**
1. **Transaction form:** Add a checkbox "Save to unit ledger" — when checked, the transaction goes to the selected unit's ledger instead of the owner's general ledger.
2. **Transaction form:** Add a checkbox "Opening balance (System transaction)" — when checked, allows SYSTEM as from_owner so user can create opening balance for owner or unit (SYSTEM → CLIENT/COMPANY, optionally with unit_id).
3. **Ledger pages (clients/company):** Add a unit dropdown to view either the owner's general ledger or a specific unit's ledger.

---

## 1. Backend Changes

### 1.1 TransactionController — Ledger Entry Logic

**File:** `app/Http/Controllers/TransactionController.php`

**Current:** When `unit_id` is set, BOTH from_owner and to_owner entries get `unit_id`.

**Change:** 
- **from_owner entry:** Always `unit_id = null` (Main's ledger is always general; unit is a recipient concept).
- **to_owner entry:** `unit_id = transaction.unit_id` when set, else null.

```php
// From owner entry - line ~326
'unit_id' => null,  // Main never tracks by unit

// To owner entry - line ~376  
'unit_id' => $unitId,  // Keep as-is (unit_id from transaction)
```

### 1.2 LedgerController — Filter by Unit

**File:** `app/Http/Controllers/LedgerController.php`

**Change in `getLedgerForOwner()`:**

- Accept optional `unit_id` query parameter.
- **General ledger (unit_id omitted or null):** `where('owner_id', $ownerId)->whereNull('unit_id')`
- **Unit ledger (unit_id provided):** `where('owner_id', $ownerId)->where('unit_id', $unitId)`
- Validate that when `unit_id` is provided, the unit belongs to the owner.

```php
// In getLedgerForOwner(), add:
$unitId = $request->input('unit_id');

// Build query
$query = OwnerLedgerEntry::query()->where('owner_id', $ownerId);

if ($unitId !== null && $unitId !== '') {
    $unit = \App\Models\Unit::find($unitId);
    if (!$unit || $unit->owner_id != $ownerId) {
        return response()->json(['success' => false, 'message' => 'Invalid unit for this owner'], 422);
    }
    $query->where('unit_id', $unitId);
} else {
    $query->whereNull('unit_id');
}
```

### 1.3 Opening Balance for Unit Ledger

When viewing a unit's ledger, the opening balance logic must also filter by `unit_id`. The `$earliestEntry` query and opening balance calculation need the same `unit_id` filter.

### 1.4 Opening Transaction Endpoint (for Unit Opening Balance)

**Backend:** Add new route `POST /api/accountant/transactions/opening`

- Creates transaction: `trans_method = 'TRANSFER'`, `trans_type = 'OPENING'`
- `from_owner_id` = SYSTEM (auto-resolved)
- `to_owner_id` = user-selected (CLIENT or COMPANY)
- `unit_id` = optional; when set, opening goes to unit's ledger
- Uses same ledger-entry logic as OwnerController::postTransaction (SYSTEM → owner/unit)
- **Note:** OwnerController::postTransaction must be updated:
  - Filter `prevToEntry` by `unit_id` when transaction has unit_id (so unit opening balance is calculated correctly).
  - For from_owner (SYSTEM) entry: set `unit_id = null` (SYSTEM has no unit ledgers).

---

## 2. Frontend — Transaction Form

### 2.1 Add "Opening Balance (System Transaction)" Checkbox

**File:** `components/accountant/transaction/UnifiedTransactionForm.tsx`

**Changes:**
- Add state: `isOpeningBalance: boolean` (default `false`).
- When **checked:**
  - Hide/lock From Owner (MAIN) — from_owner = SYSTEM (auto)
  - Show To Owner (CLIENT/COMPANY) — required
  - Show "Save to unit ledger" + unit dropdown if to_owner has units (optional for owner opening, required if user wants unit opening)
  - Submit to `POST /transactions/opening` instead of deposit/withdrawal
- When **unchecked:** Normal flow (MAIN → CLIENT/COMPANY, deposit/withdrawal).

**UX flow:**
1. Checkbox "Opening balance (System transaction)" at top or near From/To section.
2. When checked: From = SYSTEM (read-only), To = user selects, Unit = optional (for unit opening).
3. Submits to opening endpoint.

### 2.2 Add "Save to Unit Ledger" Checkbox

**File:** `components/accountant/transaction/UnifiedTransactionForm.tsx`

**Changes:**
- Add state: `saveToUnitLedger: boolean` (default `false`).
- When `saveToUnitLedger` is **false:** `unit_id` is sent as `null` (ignore any selected unit for ledger purposes).
- When `saveToUnitLedger` is **true:** `unit_id` is required; show unit dropdown; transaction goes to unit's ledger.

**UX flow:**
1. User selects To Owner (client/company).
2. If owner has units: show checkbox "Save to unit ledger".
3. When checked: show unit dropdown (required). Clear unit when unchecked.
4. When unchecked: unit dropdown hidden or disabled; `unit_id = null` on submit.

**Validation:**
- If `saveToUnitLedger` is true and `unit_id` is null → error: "Please select a unit".

### 2.2 UnitSearchCreateSection Updates

**File:** `components/accountant/transaction/UnitSearchCreateSection.tsx`

- Wrap in a section that shows only when `saveToUnitLedger` is true (or when to_owner has units and checkbox is checked).
- Label: "Unit" with helper text: "Transaction will be recorded in this unit's ledger."

### 2.3 Form Data Structure

```ts
// Add to form state
save_to_unit_ledger: false,  // Checkbox state

// On submit: 
unit_id: formData.save_to_unit_ledger ? formData.unit_id : null
```

---

## 3. Frontend — Ledger Pages

### 3.1 Clients Ledger

**File:** `app/super/accountant/ledger/clients/page.tsx`

**Changes:**
- Add state: `selectedUnitId: string | null` (null = general ledger).
- After owner selector: add unit dropdown (only when owner has units).
- Options: "General (Owner)" + list of owner's units.
- Fetch units when owner is selected: `GET /api/accountant/maintenance/units?owner_id={id}`.
- API call: include `unit_id` when a unit is selected:  
  `GET /api/accountant/ledger/clients?owner_id=X&unit_id=Y&sort=...`

### 3.2 Company Ledger

**File:** `app/super/accountant/ledger/company/page.tsx`

Same changes as clients ledger.

### 3.3 API Route Proxies

**Files:** 
- `app/api/accountant/ledger/clients/route.ts`
- `app/api/accountant/ledger/company/route.ts`

Add `unit_id` to forwarded query params:

```ts
const unitId = searchParams.get("unit_id");
if (unitId) {
  url.searchParams.append("unit_id", unitId);
}
```

---

## 4. Data Flow Summary

| Scenario | isOpeningBalance | save_to_unit_ledger | from_owner | unit_id | To Owner Ledger Entry | Ledger View |
|----------|------------------|---------------------|------------|---------|------------------------|-------------|
| Normal deposit/withdrawal | false | false | MAIN | null | owner_id, unit_id=null | General ledger |
| Normal to unit | false | true | MAIN | 123 | owner_id, unit_id=123 | Unit 123 ledger |
| Owner opening | true | false | SYSTEM | null | owner_id, unit_id=null | General ledger |
| Unit opening | true | true | SYSTEM | 123 | owner_id, unit_id=123 | Unit 123 ledger |

---

## 5. Migration / Backfill (Optional)

Existing transactions with `unit_id` set: their to_owner entries already have `unit_id`. The from_owner entries also have `unit_id` — a one-time migration could set `unit_id = null` for from_owner entries where the unit belongs to to_owner. This is optional if you want historical consistency.

---

## 6. Files to Modify

### Backend
- `app/Http/Controllers/TransactionController.php` — from_owner entry: unit_id = null; add storeOpening() + route
- `app/Http/Controllers/LedgerController.php` — add unit_id filter + validation
- `app/Http/Controllers/OwnerController.php` — postTransaction: filter prevToEntry by unit_id when transaction has unit_id
- `routes/api.php` — add POST /transactions/opening

### Frontend
- `components/accountant/transaction/UnifiedTransactionForm.tsx` — isOpeningBalance checkbox, saveToUnitLedger checkbox, conditional unit, opening endpoint, validation
- `components/accountant/transaction/UnitSearchCreateSection.tsx` — show only when "save to unit" checked
- `components/accountant/transaction/types.ts` — add `save_to_unit_ledger` if needed
- `app/super/accountant/ledger/clients/page.tsx` — unit dropdown, fetch units, pass unit_id to API
- `app/super/accountant/ledger/company/page.tsx` — same
- `app/api/accountant/ledger/clients/route.ts` — forward unit_id
- `app/api/accountant/ledger/company/route.ts` — forward unit_id

---

## 7. Edge Cases

- **Owner with no units:** Don't show "Save to unit ledger" checkbox; always use general ledger.
- **Owner with units:** Checkbox visible; when checked, unit required.
- **Switching owner:** Clear unit selection and uncheck "Save to unit ledger" when to_owner changes.
- **URL params:** Support `?owner_id=X&unit_id=Y` for deep-linking to a unit ledger.
- **Opening balance:** When isOpeningBalance checked, from_owner is SYSTEM; to_owner must be CLIENT or COMPANY (not MAIN).
- **Opening + unit:** When both checkboxes checked, unit_id required; creates opening for that unit's ledger.
