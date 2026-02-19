# Warden Management Flow

This document explains how the "Warden" functionality works across the entire application, from the database to the user interface.

## 1. Database Schema (`prisma/schema.prisma`)

We established a **One-to-Many Relationship** between Hostels and Wardens (Users).
- A **Hostel** can have multiple **Wardens**.
- A **Warden** (User) is assigned to one **Assigned Hostel**.

**User Model:**
```prisma
model User {
  // ... other fields
  role             UserRole @default(GUEST) // Role can be 'WARDEN'
  hostelId String?
  hostel   Hostel?  @relation(fields: [hostelId], references: [id])
}
```

**Hostel Model:**
```prisma
model Hostel {
  // ... other fields
  wardens User[] @relation("HostelWardens")
}
```

---

## 2. Fetching Available Wardens (`/api/users/warden`)

Before creating a hostel, we need to know who the available wardens are.
- **Endpoint:** `GET /api/users/warden`
- **Logic:** Queries the `User` table for anyone with `role: "WARDEN"`.
- **Usage:** This data is used in the "Create Hostel" form to show a list (e.g., a dropdown or multi-select) of wardens that the admin can choose from.

---

## 3. Assigning Wardens (`/api/hostels/createhostel`)

When you create a hostel, you send the selected wardens' details to variables.

- **Payload:** The API expects a `wardens` array containing objects with at least an `id`.
  ```json
  {
    "hostelname": "GreenView",
    "wardens": [ { "id": "warden_id_1" }, { "id": "warden_id_2" } ],
    ...
  }
  ```
- **Backend Service:** (`lib/services/hostelservices/hostelservices.js`)
  It uses Prisma's `connect` syntax to link existing User records to the new Hostel record.
  ```javascript
  wardens: {
      connect: wardens.map(w => ({ id: w.id }))
  }
  ```
  This updates the `hostelId` column in the `User` table for those specific wardens to match the new Hostel's ID.

---

## 4. Retrieving & Displaying Wardens (`/api/hostels`)

When displaying the list of hostels on the dashboard:

1.  **Backend Fetch:** The `gethostels` function queries the `Hostel` table.
    - **Crucial Step:** It includes the `wardens` relation in the query.
    ```javascript
    include: {
        wardens: true // Fetches the full User objects associated with this hostel
    }
    ```

2.  **Frontend Display:** (`app/(Dashboard)/admin/hostels/page.jsx`)
    - The hook `useHostel` fetches this data.
    - We map over the `hostel.wardens` array to extract potential names for display.
    ```javascript
    wardens: (h.wardens || []).map(w => w.name)
    ```
    - The UI then loops through this list of names and renders them as badges or tags in the Hostel card.

## Summary Status
- **Create:** ✅ Working (Connects wardens via ID).
- **Read:** ✅ Working (Fetches wardens via relation).
- **Update:** 🚧 (Logic would be similar: fetch current list, `disconnect` removed ones, `connect` new ones).
