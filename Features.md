# 🚀 Vendly — Feature Execution Plan (Backend)

---

# ─────────────────────────────────────────────
# PHASE 1 — DATABASE & MODEL EXTENSIONS (FOUNDATION)
# ─────────────────────────────────────────────

## 🎯 Phase Brief  
Extend database models to support:
- final call timer system  
- anti-sniping  
- user item submissions  

---

## Step 1.1 — Extend AuctionItem Model  

### 🧩 Step Brief  
Add fields to track final call timing and submission metadata.

### 📂 File  
`backend/src/models/auctionItem.model.js`

### ✅ Tasks  
- Add fields:
  - `isFinalCall` (Boolean)
  - `finalCallStartTime` (Date)
  - `finalCallEndTime` (Date)
- Add submission fields:
  - `submittedBy` (ObjectId, optional)
  - `isUserSubmitted` (Boolean)

### 🎯 Outcome  
AuctionItem supports:
- timer-based logic  
- user-submitted tracking  

---

## Step 1.2 — Extend Auction Model  

### 🧩 Step Brief  
Add configurable timing rules.

### 📂 File  
`backend/src/models/auction.model.js`

### ✅ Tasks  
- Add:
  - `finalCallDuration` (default: 30 seconds)
  - `antiSnipingExtension` (default: 10 seconds)
  - `bidCooldown` (default: 3 seconds)

### 🎯 Outcome  
Auction becomes configurable and flexible.

---

## Step 1.3 — Create ItemSubmission Model  

### 🧩 Step Brief  
Create a new collection for user-submitted items.

### 📂 File  
`backend/src/models/itemSubmission.model.js`

### ✅ Tasks  
- Create schema with:
  - `auctionId`
  - `submittedBy`
  - `title`, `description`, `imageUrls`
  - `expectedPrice`
  - `status` (pending, approved, rejected)
  - `reviewedBy`, `reviewedAt`

### 🎯 Outcome  
Moderation pipeline for user-submitted items.

---

# ─────────────────────────────────────────────
# PHASE 2 — FINAL CALL & ANTI-SNIPING ENGINE (CORE SYSTEM)
# ─────────────────────────────────────────────

## 🎯 Phase Brief  
Implement:
- final call detection  
- countdown sync  
- dynamic time extension  
- automatic item selling  

---

## Step 2.1 — Detect Final Call Start  

### 🧩 Step Brief  
Trigger final call when item enters last time window.

### 📂 File  
`backend/src/sockets/auction.socket.js`

### ✅ Tasks  
- When item becomes `live`:
  - calculate final call start time  
  - schedule timer  
- On trigger:
  - set `isFinalCall = true`
  - set `finalCallStartTime`, `finalCallEndTime`
  - emit `FINAL_CALL_STARTED`

### 🎯 Outcome  
Clients receive synchronized countdown.

---

## Step 2.2 — Handle Anti-Sniping Extension  

### 🧩 Step Brief  
Extend auction time when bid occurs during final call.

### 📂 File  
`backend/src/services/bid.service.js`

### ✅ Tasks  
- After successful bid:
  - check `isFinalCall`
- If true:
  - extend `finalCallEndTime`
  - save updated time
  - emit `FINAL_CALL_EXTENDED`

### 🎯 Outcome  
Prevents last-second sniping.

---

## Step 2.3 — Auto-End Item  

### 🧩 Step Brief  
Automatically complete auction when timer expires.

### 📂 File  
`backend/src/sockets/auction.socket.js`

### ✅ Tasks  
- Continuously check:
  - `currentTime >= finalCallEndTime`
- On expiry:
  - mark item as `sold`
  - emit:
    - `ITEM_SOLD`
    - `MY_BID_WON`

### 🎯 Outcome  
Auction completes automatically without manual action.

---

## Step 2.4 — Prevent Late Bids  

### 🧩 Step Brief  
Block bids after auction ends.

### 📂 File  
`backend/src/services/bid.service.js`

### ✅ Tasks  
- Before accepting bid:
  - check item status
  - check current time vs end time
- Reject if expired

### 🎯 Outcome  
Ensures system consistency.

---

# ─────────────────────────────────────────────
# PHASE 3 — BID COOLDOWN SYSTEM (CONTROL LAYER)
# ─────────────────────────────────────────────

## 🎯 Phase Brief  
Prevent spam bidding and ensure fairness.

---

## Step 3.1 — Create Cooldown Utility  

### 🧩 Step Brief  
Track last bid time in memory.

### 📂 File  
`backend/src/utils/bidCooldown.js`

### ✅ Tasks  
- Maintain map:
  - key: userId + auctionId  
  - value: timestamp  
- Create helpers:
  - check cooldown  
  - update time  
  - clear cooldown  

### 🎯 Outcome  
Reusable cooldown system.

---

## Step 3.2 — Enforce Cooldown  

### 🧩 Step Brief  
Block bids if cooldown not met.

### 📂 File  
`backend/src/services/bid.service.js`

### ✅ Tasks  
- Before bid processing:
  - check cooldown  
- If invalid:
  - reject bid  
  - emit `BID_ERROR`

### 🎯 Outcome  
Prevents rapid spam bidding.

---

## Step 3.3 — Reset Cooldown on Outbid  

### 🧩 Step Brief  
Allow user to bid again after being outbid.

### 📂 File  
`backend/src/services/bid.service.js`

### ✅ Tasks  
- When highest bidder changes:
  - clear cooldown for previous bidder  

### 🎯 Outcome  
Improves fairness and UX.

---

# ─────────────────────────────────────────────
# PHASE 4 — ITEM SUBMISSION SYSTEM (PLATFORM UPGRADE)
# ─────────────────────────────────────────────

## 🎯 Phase Brief  
Enable users to submit items and clients to approve them.

---

## Step 4.1 — Create Submission API  

### 🧩 Step Brief  
Allow users to submit items.

### 📂 Files  
- `controllers/itemSubmission.controller.js`  
- `routes/itemSubmission.routes.js`

### ✅ Tasks  
- Create endpoint:
  - submit item  
- Save with `status = pending`

### 🎯 Outcome  
Users can act as sellers.

---

## Step 4.2 — Client Review System  

### 🧩 Step Brief  
Allow approval/rejection of submissions.

### 📂 File  
`itemSubmission.controller.js`

### ✅ Tasks  
- Add endpoints:
  - approve  
  - reject  
- On approve:
  - create AuctionItem  
- On reject:
  - update status  

### 🎯 Outcome  
Client moderation workflow.

---

## Step 4.3 — Link Submission to AuctionItem  

### 🧩 Step Brief  
Preserve submission metadata.

### 📂 File  
`backend/src/controllers/auctionItem.controller.js`

### ✅ Tasks  
- When creating from submission:
  - set `submittedBy`
  - set `isUserSubmitted = true`

### 🎯 Outcome  
Maintains traceability.

---

# ─────────────────────────────────────────────
# PHASE 5 — SOCKET EVENT ENHANCEMENTS (SYNC LAYER)
# ─────────────────────────────────────────────

## 🎯 Phase Brief  
Enhance real-time communication for new features.

---

## Step 5.1 — Add New Events  

### 🧩 Step Brief  
Support new system behaviors.

### 📂 File  
`backend/src/sockets/auction.socket.js`

### ✅ Tasks  
Add events:
- `FINAL_CALL_STARTED`
- `FINAL_CALL_EXTENDED`
- `BID_COOLDOWN_ACTIVE`
- `SUBMISSION_CREATED`
- `SUBMISSION_APPROVED`
- `SUBMISSION_REJECTED`

---

## Step 5.2 — Emit Cooldown Errors  

### 🧩 Step Brief  
Notify users when blocked.

### 📂 File  
`auction.socket.js`

### ✅ Tasks  
- Emit `BID_ERROR` when cooldown fails

---

## Step 5.3 — Reconnection Sync  

### 🧩 Step Brief  
Ensure accurate state on reconnect.

### 📂 File  
`auction.socket.js`

### ✅ Tasks  
- On join:
  - send remaining time  
  - send final call state  

### 🎯 Outcome  
Robust real-time experience.

---

# 🔥 FINAL IMPLEMENTATION ORDER
