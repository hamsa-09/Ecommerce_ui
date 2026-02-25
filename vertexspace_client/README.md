# VertexSpace UI (Frontend)

Frontend application for the VertexSpace workspace management platform.

This UI supports:
- Authentication and role-based access
- Resource management (rooms, desks, parking)

## Tech Stack

- React 19

## Project Structure

```text
src/
	components/
		Navbar.jsx
		Notifications.jsx
		ProtectedRoute.jsx
		RoleBased.jsx
	constants/
		api.js
	context/
		AuthContext.jsx
	pages/
		Login.jsx
		Register.jsx
		Dashboard.jsx
		Resources.jsx
		ResourceDetail.jsx
		Booking.jsx
		Buildings.jsx
		Floors.jsx
		DeskAssignments.jsx
	services/
		authService.js
		resourceService.js
		BookingService.js
		dashboardService.js
		DeskAssignmentService.js
		notificationService.js
```

---

## Role Access (Current UI)

- **USER**
	- View/book resources
	- Manage own bookings
	- Waitlist actions for selected slots

- **DEPARTMENT_ADMIN**
	- Same as USER
	- View/cancel other user bookings (as permitted by backend)
	- Desk assignment management page

- **SYSTEM_ADMIN**
	- Full resource administration in UI
	- Building/Floor creation and listing
	- Desk assignment management page

> Note: Final authorization is always enforced by backend APIs.

---

## Prerequisites

- Node.js 18+
- npm 9+
- VertexSpace backend running (default expected at `http://localhost:8080`)

---

## Setup

From this folder (`vertexspace_client`):

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Build production bundle:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

Lint:

```bash
npm run lint
```

---

## API Base URL

Current API base URL is configured in:

`src/constants/api.js`

```js
export const API_BASE_URL = "http://localhost:8080/api";
```

If your backend runs on a different host/port, update this value.

---

## Realtime Notifications

Notification UI is mounted in the navbar for logged-in users.

Flow:
1. Fetch existing notifications from `GET /api/notifications`
2. Open SockJS connection to `/ws`
3. Authenticate STOMP connect with `Authorization: Bearer <token>`
4. Subscribe to `/user/queue/notifications`
5. Push incoming messages into notification dropdown in real time

Timestamp display in notifications is converted to IST.

---

## Implemented Milestones (Frontend)

- Auth and role-based routing
- Resource CRUD (role-gated in UI)
- Booking management with recurring grouping
- Range-based booking filters
- Waitlist join/leave/status/accept with offer timer
- Dashboard recommendations and best-slot search
- Building/Floor management pages (system admin)
- Desk assignment admin UI (dept + system admin)
- Realtime notifications (SockJS/STOMP)

---
