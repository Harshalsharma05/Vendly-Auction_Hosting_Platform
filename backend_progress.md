# Vendly - Backend Integration Guide & API Documentation

## 🚀 Project Overview
Vendly is a real-time, multi-tenant auction hosting platform.
*   **Tech Stack:** Node.js, Express, MongoDB, Socket.IO.
*   **Base URL (Local):** `http://localhost:5000/api`
*   **Socket.IO URL:** `ws://localhost:5000`

## 🔐 Authentication & Roles
The API uses **JWT (JSON Web Tokens)** passed in the `Authorization` header.
*   **Format:** `Authorization: Bearer <your_jwt_token>`
*   **Roles:** 
    *   `participant`: Can view auctions, join rooms, and place bids.
    *   `client` (Host): Can create auctions, add items, and control the live auction flow.
    *   `admin`: Platform manager (approves client profiles).

All responses follow a standard format:
```json
{
  "success": true,
  "data": {} // or "message", "count", "errors"
}
```
---

## 📚 REST API Endpoints

### 1. Auth System (`/api/auth`)
Handles user registration, login, and session checks.

#### `POST /api/auth/register`
*   **Access:** Public
*   **Functionality:** Creates a new user account.
*   **Request Body:**
    ```json
    {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "password": "securepassword123",
      "role": "client" 
    }
    ```

#### `POST /api/auth/login`
*   **Access:** Public
*   **Functionality:** Authenticates user and returns JWT token.
*   **Request Body:**
    ```json
    {
      "email": "john.doe@example.com",
      "password": "securepassword123"
    }
    ```

#### `GET /api/auth/me`
*   **Access:** Private (Any Role)
*   **Functionality:** Returns the currently logged-in user's data based on token.

#### `POST /api/auth/logout`
*   **Access:** Public
*   **Functionality:** Returns a success message to trigger frontend token clearance.

---

### 2. Client Profile System (`/api/clients`)
Handles business profiles for users with the `client` role.

#### `POST /api/clients/profile`
*   **Access:** Private (`client` only)
*   **Functionality:** Creates or updates the client's business profile.
*   **Request Body:**
    ```json
    {
      "organizationName": "Acme Fine Arts",
      "contactNumber": "+1234567890",
      "description": "Premium art auctioneers.",
      "website": "https://acmefinearts.com"
    }
    ```

#### `GET /api/clients/profile`
*   **Access:** Private (`client` only)
*   **Functionality:** Gets the logged-in client's profile.

#### `GET /api/clients/admin/pending`
*   **Access:** Private (`admin` only)
*   **Functionality:** Lists all client profiles waiting for admin approval.

#### `PATCH /api/clients/admin/:id/status`
*   **Access:** Private (`admin` only)
*   **Functionality:** Approves, rejects, or suspends a client profile.
*   **Request Body:**
    ```json
    {
      "status": "approved" 
    }
    ```

---

### 3. Auction Management (`/api/auctions`)
Handles the creation and lifecycle of auction rooms.

#### `POST /api/auctions`
*   **Access:** Private (`client` only)
*   **Functionality:** Creates a new auction event.
*   **Request Body:**
    ```json
    {
      "title": "Spring Contemporary Art Sale",
      "description": "An exclusive collection of modern art.",
      "startTime": "2026-05-10T10:00:00Z",
      "endTime": "2026-05-10T14:00:00Z",
      "status": "draft"
    }
    ```

#### `GET /api/auctions`
*   **Access:** Public
*   **Functionality:** Returns all `scheduled`, `live`, or `ended` auctions (hides drafts).

#### `GET /api/auctions/client/my-auctions`
*   **Access:** Private (`client` only)
*   **Functionality:** Returns all auctions created by the logged-in client.

#### `GET /api/auctions/:id`
*   **Access:** Public
*   **Functionality:** Gets details for a single auction.

#### `PATCH /api/auctions/:id`
*   **Access:** Private (`client` only - Host)
*   **Functionality:** Updates auction details or transitions status (`draft` -> `scheduled`).
*   **Request Body:**
    ```json
    {
      "status": "scheduled"
    }
    ```

#### `DELETE /api/auctions/:id`
*   **Access:** Private (`client` only - Host)
*   **Functionality:** Deletes an auction (only if not live/ended).

---

### 4. Auction Items (`/api/items`)
Handles items listed inside an auction.

#### `POST /api/items/auction/:auctionId`
*   **Access:** Private (`client` only - Host)
*   **Functionality:** Adds an item to a specific auction. Auto-calculates the display `order`.
*   **Request Body:**
    ```json
    {
      "title": "1964 Rolex Submariner",
      "description": "Mint condition, original box and papers.",
      "startingPrice": 10000,
      "bidIncrement": 500,
      "imageUrls": ["https://images.com/rolex1.jpg"]
    }
    ```

#### `GET /api/items/auction/:auctionId`
*   **Access:** Public
*   **Functionality:** Gets all items for an auction, sorted by their `order`.

#### `PATCH /api/items/:id`
*   **Access:** Private (`client` only - Host)
*   **Functionality:** Updates item details (cannot update if `live` or `sold`).
*   **Request Body:**
    ```json
    {
      "startingPrice": 12000
    }
    ```

#### `DELETE /api/items/:id`
*   **Access:** Private (`client` only - Host)
*   **Functionality:** Deletes an item from the auction.

---

### 5. Participants (`/api/participants`)
Manages the roster of users who have joined an auction room.

#### `POST /api/participants/auction/:auctionId/join`
*   **Access:** Private (Any Role)
*   **Functionality:** Registers a user to an auction room. Prevents duplicate joins.
*   **Request Body:**
    ```json
    {
      "role": "participant" 
    }
    ```

#### `GET /api/participants/auction/:auctionId`
*   **Access:** Public
*   **Functionality:** Returns the roster of all users who joined the auction.

---

### 6. Bid History (`/api/bids`)
Fetches historical bidding data.

#### `GET /api/bids/auction/:auctionId`
*   **Access:** Public
*   **Functionality:** Gets the complete timeline of all bids across all items in an auction.

#### `GET /api/bids/item/:itemId`
*   **Access:** Public
*   **Functionality:** Gets the bid history for a single specific item.

#### `GET /api/bids/my-bids`
*   **Access:** Private
*   **Functionality:** Gets a history of all bids placed by the currently logged-in user.

---

## ⚡ Socket.IO Real-Time Engine API
The real-time engine handles live bidding and host controls.

### Connection & Authentication
Clients must pass the JWT token during the socket connection handshake:
```javascript
// Frontend implementation example
const socket = io('ws://localhost:5000', {
  auth: { token: "Bearer <your_jwt_token>" }
});
```

### 📡 Events the Frontend should EMIT (Send to Server)

| Event Name | Payload (Data) | Description |
| :--- | :--- | :--- |
| `JOIN_AUCTION` | `"<auctionId>"` (String) | Joins the specific auction room. |
| `LEAVE_AUCTION` | `"<auctionId>"` (String) | Leaves the auction room. |
| `PLACE_BID` | `{ auctionId, itemId, bidAmount }` | Places a bid on a live item. |
| `START_AUCTION` | `"<auctionId>"` (String) | **[HOST ONLY]** Sets auction & first item to `live`. |
| `NEXT_ITEM` | `{ auctionId, currentItemId }` | **[HOST ONLY]** Marks current item sold, makes next item `live`. |
| `END_AUCTION` | `"<auctionId>"` (String) | **[HOST ONLY]** Ends auction and kicks users from room. |

**Example `PLACE_BID` Payload:**
```json
{
  "auctionId": "60d5ecb8b392...",
  "itemId": "60d5ecb8b393...",
  "bidAmount": 10500
}
```

### 🎧 Events the Frontend should LISTEN FOR (Receive from Server)

| Event Name | Expected Data payload | Triggered When |
| :--- | :--- | :--- |
| `AUCTION_JOINED` | `{ message, user: { id, name } }` | Another user joins the room. |
| `NEW_BID` | `{ message, itemId, currentHighestBid, currentHighestBidder, bidCount }` | A valid bid is placed by ANY user. Update UI instantly. |
| `BID_ERROR` | `{ message }` | A bid fails (e.g., amount too low, race condition). |
| `AUCTION_STARTED`| `{ message, activeItem }` | Host starts the auction. Load the `activeItem` into UI. |
| `ITEM_TRANSITION`| `{ message, previousItem, activeItem }` | Host moves to next item. Update the live item in UI. |
| `NO_MORE_ITEMS` | `{ message }` | Host clicks next, but no items remain. |
| `AUCTION_ENDED` | `{ message }` | Host ends the auction. Redirect users or show summary. |
| `CONTROL_ERROR` | `{ message }` | **[HOST ONLY]** Host tries an invalid control action. |

---
**End of Document**