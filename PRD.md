# Product Requirements Document (PRD): GoWA Unified Web Panel

## 1. Executive Summary & Objective

GoWA Web Panel is a standalone, ultra-responsive single-page dashboard designed for the GoWA WhatsApp Web Multi-Device backend (`github.com/dresar/gowanew`).

The current dashboard lacks mobile responsiveness, visual hierarchy, and cohesive interaction feedback. This project replaces the existing interface with a high-density, responsive control panel that bundles into a single self-contained HTML file (`dist/index.html`).

### Key Operational Goals

- **Single-Server Delivery:** The Go binary serves the entire frontend directly at `/` from an in-memory copy backed by disk (`storages/ui/index.html`). No separate Node.js runtime or secondary port runs in production.
- **Self-Contained Artifact:** The client bundles all scripts, CSS, SVGs, and web fonts into one file with zero runtime requests to external CDNs or unverified domains.
- **Full API Parity:** 100% coverage across all 40+ REST endpoints, WebSocket event streams, and device-scoped workflows.
- **Precision UI Standards:** Compact 32–38px interactive controls, 6–8px subtle corner radii, WCAG AA contrast compliance, dark/light modes, and a dedicated mobile slide-over drawer.

---

## 2. System Architecture & VPS Deployment Topology

```
+-------------------------------------------------------------------------+
|                              Production VPS                             |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |                 GoWA Backend Service (Port 3000)                  |  |
|  |                                                                   |  |
|  |  +------------------------+        +---------------------------+  |  |
|  |  |       Fiber HTTP       |        |      whatsmeow Engine     |  |  |
|  |  |   - REST API Routes    | <----> |  - Multi-Device Sessions  |  |  |
|  |  |   - WebSocket Hub      |        |  - SQLite (whatsapp.db)   |  |  |
|  |  +------------------------+        +---------------------------+  |  |
|  |               ^                                                   |  |
|  |               | Serves UI at "/"                                  |  |
|  |  +-------------------------------------------------------------+  |  |
|  |  |                     UI Asset Manager                        |  |  |
|  |  |   1. Reads local cache: storages/ui/index.html              |  |  |
|  |  |   2. Optional Auto-Update: Fetches release asset from GitHub|  |  |
|  |  +-------------------------------------------------------------+  |  |
|  +-------------------------------------------------------------------+  |
+-------------------------------------------------------------------------+
                                   ^
                                   | HTTP / WebSocket
                                   v
+-------------------------------------------------------------------------+
|                           User Web Browser                              |
|   Loads single-page application bundle (dist/index.html).               |
|   Stores server URL, credentials, and active device in localStorage.   |
+-------------------------------------------------------------------------+
```

### Deployment Workflow

1. **Frontend Build Pipeline:**
   - Command: `npm run build`
   - Bundler: Vite with `vite-plugin-singlefile`.
   - Output: `dist/index.html` (~1.2 MB, zero external dependencies).
2. **Release Distribution:**
   - Tagging a release (`v*`) builds the single HTML artifact and uploads it as `gowa-ui.html` to GitHub releases.
   - For air-gapped or offline setups, copy `dist/index.html` directly to `storages/ui/index.html` in the backend working directory.
3. **Runtime Execution:**
   - Only the compiled Go binary (`gowanew`) executes on the server.
   - On boot, `uiasset.LoadCache()` searches `storages/ui/index.html` and pre-configured dist paths.
   - When users open `http://<vps-ip>:3000/`, the Go server returns the cached dashboard HTML directly with ETag caching and gzip compression.

---

## 3. Authentication & Gateway Integration

### 3.1 HTTP Basic Auth

The Go backend protects all routes using HTTP Basic Auth when configured via `APP_BASIC_AUTH=user:pass`.

- **Initial Handshake:** If the backend returns `401 Unauthorized`, the dashboard presents a modal prompting for Username and Password.
- **Persistence:** Credentials encode to Base64 and persist in `localStorage` under key `gowa_auth_token`.
- **Axios / Fetch Interceptor:** Every outbound HTTP request injects header `Authorization: Basic <base64>`.
- **Session Revocation:** A Logout action in the UI clears stored tokens and reloads the connect screen.

### 3.2 WebSocket Authentication

Browsers cannot inject custom HTTP headers into native `new WebSocket()` connections.

- **Mechanism:** The dashboard establishes connection using query string:
  `ws://<host>:<port>/ws?device_id=<id>&authorization=<base64>`
- **Backend Decoder:** Middleware `WebsocketQueryAuth()` extracts the `authorization` parameter, normalizes URL-encoded spaces (`+`), and assigns it to the internal authorization header before basic auth checks execute.
- **Reconnection Logic:** Exponential backoff reconnects automatically on network drops (1s, 2s, 4s, up to 30s max jittered delay).

---

## 4. Complete Backend API Coverage Specification

Every request directed to a device-scoped endpoint includes header `X-Device-Id: <device_id>`.

### 4.1 System & App Info

| Method | Route       | Description                       | Request Parameters / Body | Response Payload                                                                                                         |
| :----- | :---------- | :-------------------------------- | :------------------------ | :----------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/health`   | Server health probe               | None (Public)             | Text: `"OK"`                                                                                                             |
| `GET`  | `/app/info` | Server capabilities & file limits | None                      | `version`, `os`, `base_path`, `max_file_size`, `max_video_size`, `max_image_size`, `scheduled_sends`, `chatwoot_enabled` |

### 4.2 Multi-Device Management

| Method   | Route                            | Description                    | Request Payload                                                                                | Response Payload                                        |
| :------- | :------------------------------- | :----------------------------- | :--------------------------------------------------------------------------------------------- | :------------------------------------------------------ |
| `GET`    | `/devices`                       | List registered sessions       | None                                                                                           | Array of `{ id, display_name, jid, state, created_at }` |
| `POST`   | `/devices`                       | Register a new device slot     | `{ device_id, webhook_url?, webhook_secret?, webhook_events?, webhook_insecure_skip_verify? }` | Device metadata                                         |
| `GET`    | `/devices/:device_id`            | Read single device metadata    | None                                                                                           | Device metadata & connection state                      |
| `DELETE` | `/devices/:device_id`            | Delete session and credentials | None                                                                                           | Success acknowledgment                                  |
| `GET`    | `/devices/:device_id/login`      | Initiate QR code pairing       | None                                                                                           | `{ qr_link, qr_duration, device_id }`                   |
| `POST`   | `/devices/:device_id/login/code` | Request phone pairing code     | Query param: `?phone=628xxx`                                                                   | `{ pair_code, device_id }`                              |
| `POST`   | `/devices/:device_id/logout`     | Disconnect WhatsApp session    | None                                                                                           | Success acknowledgment                                  |
| `POST`   | `/devices/:device_id/reconnect`  | Trigger session reconnection   | None                                                                                           | Success acknowledgment                                  |
| `GET`    | `/devices/:device_id/status`     | Read live connection state     | None                                                                                           | `{ is_connected, is_logged_in, device_id }`             |
| `GET`    | `/devices/:device_id/webhook`    | Fetch per-device webhook       | None                                                                                           | Webhook URL, secret, event filter, TLS verify           |
| `PATCH`  | `/devices/:device_id/webhook`    | Update per-device webhook      | Webhook settings object                                                                        | Updated webhook configuration                           |

### 4.3 Messaging & Broadcast Suite

| Method | Route                 | Description                | Payload Format   | Parameters                                                               |
| :----- | :-------------------- | :------------------------- | :--------------- | :----------------------------------------------------------------------- |
| `POST` | `/send/message`       | Send plaintext message     | JSON / Form      | `phone`, `message`, `reply_message_id`, `schedule`                       |
| `POST` | `/send/image`         | Send image file or URL     | Multipart / JSON | `phone`, `image` (binary or URL), `caption`, `view_once`, `compress`     |
| `POST` | `/send/file`          | Send document / file       | Multipart / JSON | `phone`, `file` (binary or URL)                                          |
| `POST` | `/send/video`         | Send video clip            | Multipart / JSON | `phone`, `video` (binary or URL), `caption`, `view_once`                 |
| `POST` | `/send/sticker`       | Send WebP sticker          | Multipart / JSON | `phone`, `sticker` (binary or URL)                                       |
| `POST` | `/send/contact`       | Send vCard contact         | JSON             | `phone`, `contact_name`, `contact_phone`                                 |
| `POST` | `/send/link`          | Send URL with preview      | JSON             | `phone`, `link`, `caption`                                               |
| `POST` | `/send/location`      | Send geographic coordinate | JSON             | `phone`, `latitude`, `longitude`                                         |
| `POST` | `/send/audio`         | Send voice note / audio    | Multipart / JSON | `phone`, `audio` (binary or URL), `ptt` (boolean)                        |
| `POST` | `/send/poll`          | Send interactive poll      | JSON             | `phone`, `question`, `options` (array), `max_answer`                     |
| `POST` | `/send/presence`      | Set user status            | JSON             | `presence`: `"available"` \| `"unavailable"`                             |
| `POST` | `/send/chat-presence` | Emit typing or audio pulse | JSON             | `phone`, `action`: `"composing"` \| `"recording"` \| `"paused"`, `media` |

### 4.4 Scheduled Message Engine

| Method | Route                                 | Description            | Query / Params                                        |
| :----- | :------------------------------------ | :--------------------- | :---------------------------------------------------- |
| `GET`  | `/send/schedules`                     | List queued schedules  | `status`, `search`, `message_type`, `limit`, `offset` |
| `GET`  | `/send/schedules/:schedule_id`        | Read schedule detail   | Path: `schedule_id`                                   |
| `POST` | `/send/schedules/:schedule_id/pause`  | Pause pending schedule | Path: `schedule_id`                                   |
| `POST` | `/send/schedules/:schedule_id/resume` | Resume paused schedule | Path: `schedule_id`                                   |
| `POST` | `/send/schedules/:schedule_id/cancel` | Cancel schedule item   | Path: `schedule_id`                                   |

### 4.5 Live Conversations & Message Management

| Method | Route                           | Description                 | Query / Params                                                      |
| :----- | :------------------------------ | :-------------------------- | :------------------------------------------------------------------ |
| `GET`  | `/chats`                        | Paginated chat list         | `limit`, `offset`, `search`, `has_media`, `archived`                |
| `GET`  | `/chat/:chat_jid/messages`      | Fetch messages in thread    | `limit`, `offset`, `media_only`, `search`, `start_time`, `end_time` |
| `POST` | `/chat/:chat_jid/pin`           | Pin or unpin chat           | Body: `{ pin: boolean }`                                            |
| `POST` | `/chat/:chat_jid/disappearing`  | Set message expiry timer    | Body: `{ timer: duration }`                                         |
| `POST` | `/chat/:chat_jid/archive`       | Archive or unarchive chat   | Body: `{ archive: boolean }`                                        |
| `POST` | `/chat/:chat_jid/history`       | Request older message batch | Body: `{ count: number }`                                           |
| `POST` | `/message/:message_id/reaction` | Send emoji reaction         | Body: `{ phone, reaction }`                                         |
| `POST` | `/message/:message_id/revoke`   | Revoke message for everyone | Body: `{ phone }`                                                   |
| `POST` | `/message/:message_id/delete`   | Delete message for me       | Body: `{ phone }`                                                   |
| `POST` | `/message/:message_id/update`   | Edit text of sent message   | Body: `{ phone, message }`                                          |
| `POST` | `/message/:message_id/read`     | Mark message as read        | Body: `{ phone }`                                                   |
| `POST` | `/message/:message_id/played`   | Mark voice note as played   | Body: `{ phone }`                                                   |
| `POST` | `/message/:message_id/star`     | Star message                | Body: `{ phone }`                                                   |
| `POST` | `/message/:message_id/unstar`   | Unstar message              | Body: `{ phone }`                                                   |
| `POST` | `/message/:message_id/forward`  | Forward message to target   | Body: `{ phone, destination_phone }`                                |
| `GET`  | `/message/:message_id/download` | Fetch decrypted media URL   | Query: `?phone=628xxx`                                              |

### 4.6 Group Command Center

| Method | Route                                 | Description                  | Parameters                                  |
| :----- | :------------------------------------ | :--------------------------- | :------------------------------------------ |
| `POST` | `/group`                              | Create group conversation    | Body: `{ title, participants: [...] }`      |
| `POST` | `/group/join-with-link`               | Join group via invite link   | Body: `{ link }`                            |
| `GET`  | `/group/info-from-link`               | Inspect link without joining | Query: `?link=...`                          |
| `GET`  | `/group/info`                         | Fetch group metadata         | Query: `?group_jid=...`                     |
| `POST` | `/group/leave`                        | Leave group                  | Body: `{ group_jid }`                       |
| `GET`  | `/group/participants`                 | Fetch group participant list | Query: `?group_jid=...`                     |
| `GET`  | `/group/participants/export`          | Download participants CSV    | Query: `?group_jid=...` (direct download)   |
| `POST` | `/group/participants`                 | Add participants to group    | Body: `{ group_jid, participants: [...] }`  |
| `POST` | `/group/participants/remove`          | Kick participants from group | Body: `{ group_jid, participants: [...] }`  |
| `POST` | `/group/participants/promote`         | Promote members to admin     | Body: `{ group_jid, participants: [...] }`  |
| `POST` | `/group/participants/demote`          | Demote admins to members     | Body: `{ group_jid, participants: [...] }`  |
| `GET`  | `/group/participant-requests`         | List join approval queue     | Query: `?group_jid=...`                     |
| `POST` | `/group/participant-requests/approve` | Approve join requests        | Body: `{ group_jid, participants: [...] }`  |
| `POST` | `/group/participant-requests/reject`  | Reject join requests         | Body: `{ group_jid, participants: [...] }`  |
| `POST` | `/group/photo`                        | Upload new group picture     | Multipart: `photo`, Query: `?group_jid=...` |
| `POST` | `/group/name`                         | Change group title           | Body: `{ group_jid, name }`                 |
| `POST` | `/group/locked`                       | Restrict group info edits    | Body: `{ group_jid, locked: boolean }`      |
| `POST` | `/group/announce`                     | Announcement mode toggle     | Body: `{ group_jid, announce: boolean }`    |
| `POST` | `/group/topic`                        | Update group description     | Body: `{ group_jid, topic }`                |
| `GET`  | `/group/invite-link`                  | Get or revoke invite link    | Query: `?group_jid=...&reset=boolean`       |

### 4.7 Account, Privacy & Contacts

| Method | Route                    | Description                  | Parameters                          |
| :----- | :----------------------- | :--------------------------- | :---------------------------------- |
| `GET`  | `/user/info`             | Query contact profile        | Query: `?phone=...`                 |
| `GET`  | `/user/avatar`           | Get user profile picture     | Query: `?phone=...&is_preview=bool` |
| `POST` | `/user/avatar`           | Update own account avatar    | Multipart: `avatar`                 |
| `POST` | `/user/pushname`         | Update WhatsApp push name    | Body: `{ pushname }`                |
| `GET`  | `/user/my/privacy`       | Read privacy preferences     | None                                |
| `GET`  | `/user/my/groups`        | List joined group IDs        | None (Max 500 WhatsApp limit)       |
| `GET`  | `/user/my/newsletters`   | List joined newsletter IDs   | None                                |
| `GET`  | `/user/my/contacts`      | List device contact book     | None                                |
| `GET`  | `/user/check`            | Verify if phone has WhatsApp | Query: `?phone=...`                 |
| `GET`  | `/user/business-profile` | Fetch business profile data  | Query: `?phone=...`                 |

### 4.8 Newsletters & Voice Calls

| Method | Route                                      | Description           | Parameters                                 |
| :----- | :----------------------------------------- | :-------------------- | :----------------------------------------- |
| `POST` | `/newsletter/unfollow`                     | Unfollow channel      | Body: `{ newsletter_jid }`                 |
| `GET`  | `/newsletter/messages`                     | Read channel messages | Query: `newsletter_jid`, `count`, `before` |
| `GET`  | `/newsletter/messages/:server_id/download` | Download media item   | Path: `server_id`                          |
| `POST` | `/call/reject`                             | Reject incoming call  | Body: `{ caller_jid, call_id }`            |

---

## 5. UI/UX Directives & Layout Hierarchy

### 5.1 Design Tokens & Anti-Slop Discipline

- **Compact Controls:** Standard buttons and input fields measure 34px to 38px in height. Small variants sit at 28px.
- **Corner Radii:** Buttons use `rounded-md` (6px) or `rounded-lg` (8px). Large pill shapes (`rounded-full`) are barred from forms, inputs, and action triggers.
- **Palette & Contrast:** Monochromatic slate/zinc surfaces with emerald accent indicators for connected statuses. Text meets WCAG AA standards (minimum contrast ratio 4.5:1).
- **Typography:**
  - Headings: Bricolage Grotesque
  - Body & Form Labels: Figtree
  - Code, JIDs, Phone Numbers, JSON: JetBrains Mono

### 5.2 Mobile-First Breakpoints

- **Desktop (>= 1024px):** Fixed glass sidebar with icon + label navigation, top bar with device switcher, live WebSocket badge, and theme toggle.
- **Tablet (768px - 1023px):** Compact collapsible sidebar.
- **Mobile (< 768px):** Slide-over navigation drawer opened via a header hamburger trigger. Primary actions render with full-width tap targets (minimum 44x44px). The chat workspace supports one-handed navigation with back-to-list transitions.

---

## 6. Verification & Quality Acceptance Criteria

1. **Build Integrity:** `npm run build` completes with zero TypeScript errors and generates a single `dist/index.html` file without external network dependencies.
2. **Offline & Air-Gap Execution:** Copying `dist/index.html` into `storages/ui/index.html` allows the Go server to boot and serve the panel with network access severed.
3. **Multi-Device State Management:** Switching devices in the top selector updates the `X-Device-Id` header across all subsequent API queries and switches the active WebSocket room.
4. **Real-Time Responsiveness:** Inbound WhatsApp messages, delivery receipts, and QR code regenerations render immediately through the active WebSocket channel without full page refreshes.
