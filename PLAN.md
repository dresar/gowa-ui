# Master Implementation Plan: GoWA Unified Web Panel

This plan outlines the architecture, page layouts, component structure, endpoint integration, and build workflow for the GoWA Web Panel.

---

## 1. Architecture & Technology Stack

- **Runtime & Framework:** React 19 + TypeScript + Vite.
- **Styling & Design Tokens:** Tailwind CSS v4 + Shadcn UI primitives + Lucide Icons.
- **Typography:** Bricolage Grotesque (headings), Figtree (UI body), JetBrains Mono (code, JIDs, timestamps).
- **State Management:**
  - `zustand`: Session configuration (`useConnection`), active device selection (`useDevice`), shared recipient state (`useRecipient`).
  - `@tanstack/react-query`: Server state caching, optimistic updates, and background refetching.
- **Bundler Contract:** `vite-plugin-singlefile` compiling all assets into a single self-contained `dist/index.html` file.
- **Backend Host:** GoWA HTTP service running on a single port (default: 3000) serving `dist/index.html` at `/`.

---

## 2. Directory & Component Hierarchy

```
golangwaui/
|-- src/
|   |-- assets/              # Inline SVGs, webp logos, base64 favicon
|   |-- components/
|   |   |-- layout/
|   |   |   |-- app-shell.tsx       # Root responsive layout (sidebar + header + main)
|   |   |   |-- device-switcher.tsx # Dropdown device selector with active state indicator
|   |   |   |-- logo.tsx            # Compact vector brand mark
|   |   |   |-- theme-toggle.tsx    # Dark / Light theme switcher
|   |   |   `-- ws-badge.tsx        # Live WebSocket pulse badge (Connected/Disconnected)
|   |   |-- shared/
|   |   |   |-- action-card.tsx     # Card container with title, description, and action button
|   |   |   |-- empty-state.tsx     # Clean placeholder view for empty tables/lists
|   |   |   |-- phone-input.tsx     # Normalized WhatsApp phone input with country code
|   |   |   `-- result-panel.tsx    # API response viewer with cURL exporter
|   |   `-- ui/                     # Shadcn primitives (button, dialog, sheet, table, etc.)
|   |-- features/
|   |   |-- account/         # Profile, push name, avatar, privacy, contacts
|   |   |-- call/            # Incoming call alert banner and rejection dialog
|   |   |-- chat/            # Live chat list, message thread, message bubble, media player
|   |   |-- devices/         # Device cards, QR dialog, pair code modal, webhook editor
|   |   |-- group/           # Group creator, participants table, join requests, invite link
|   |   |-- message/         # Message action forms (react, delete, revoke, edit, star)
|   |   |-- messaging/       # Recipient selector bar and broadcast mode switcher
|   |   |-- newsletter/      # Newsletter list, message viewer, media download
|   |   |-- send/            # Form controls for text, image, file, video, audio, poll, etc.
|   |   `-- session/         # Passkey WebAuthn challenge dialog
|   |-- hooks/               # Custom hooks: useAppInfo, useDevices, useActionMutation
|   |-- lib/                 # HTTP client, WebSocket bus, formatters, JID parser, cURL generator
|   |-- pages/
|   |   |-- connect.tsx      # Gateway server setup and HTTP Basic Auth form
|   |   |-- dashboard.tsx    # Device overview, active session metrics, quick actions
|   |   |-- messaging.tsx    # Multi-mode broadcast composer (12 message types)
|   |   |-- scheduled.tsx    # Scheduled send queue manager (pause, resume, cancel)
|   |   |-- chats.tsx        # Interactive WhatsApp Web chat workspace
|   |   |-- groups.tsx       # Group management and participant administration
|   |   |-- account.tsx      # Profile settings, privacy controls, contact directory
|   |   |-- misc.tsx         # Newsletters, channels, and call log controls
|   |   `-- settings.tsx     # Server connection settings, credentials, and app metadata
|   |-- stores/              # Zustand global state stores
|   `-- main.tsx             # Application bootstrap and QueryClient provider
`-- vite.config.ts           # Single-file bundler configuration with backend proxies
```

---

## 3. UI/UX Page Breakdown & Endpoint Integrations

### Phase 1: Gateway & Authentication (`/connect`)

- **Visual Design:** Centered card with glass backdrop, server URL input, username, and password fields.
- **Interactions:**
  - Validates URL by probing `GET /health` and `GET /app/info`.
  - Captures `401 Unauthorized` and displays a credential prompt.
  - Encodes `username:password` to Base64 and persists to `localStorage`.
  - Redirects to `/` immediately upon successful verification.

### Phase 2: Device Management & Overview (`/`)

- **Visual Design:** Grid of compact device cards showing session state (`CONNECTED`, `PAIRING`, `DISCONNECTED`).
- **Endpoints:**
  - `GET /devices`: Lists all active and inactive device sessions.
  - `POST /devices`: Creates a new device slot with optional webhook parameters.
  - `GET /devices/:device_id/login`: Opens QR code modal with real-time countdown timer.
  - `POST /devices/:device_id/login/code`: Triggers 8-character phone pairing code modal.
  - `POST /devices/:device_id/reconnect`: Forces session reconnection.
  - `POST /devices/:device_id/logout`: Closes session.
  - `DELETE /devices/:device_id`: Removes credentials and session from database.
  - `GET` & `PATCH /devices/:device_id/webhook`: Configures per-device webhook URL, secret, and event filters.

### Phase 3: Interactive Chat Workspace (`/chats`)

- **Visual Design:** Split-pane interface: Left pane lists conversations with search and filter tabs; right pane displays the active message thread and message composer.
- **Endpoints:**
  - `GET /chats`: Loads paginated chat list with search, archived, and media filters.
  - `GET /chat/:chat_jid/messages`: Fetches chronological message history.
  - `POST /chat/:chat_jid/history`: Fetches older messages from WhatsApp servers.
  - `POST /chat/:chat_jid/pin`: Toggles pin state.
  - `POST /chat/:chat_jid/archive`: Toggles archive state.
  - `POST /chat/:chat_jid/disappearing`: Sets disappearing message timer.
- **Message Actions:**
  - `POST /message/:id/reaction`: Emoji reaction picker.
  - `POST /message/:id/update`: In-place text editor for sent messages.
  - `POST /message/:id/revoke`: Revokes message for everyone.
  - `POST /message/:id/delete`: Deletes message locally.
  - `POST /message/:id/star` & `unstar`: Stars or unstars message.
  - `POST /message/:id/forward`: Forward modal targeting specific JIDs.
  - `GET /message/:id/download`: Triggers browser download for decrypted media.

### Phase 4: Broadcast & Messaging Center (`/messaging`)

- **Visual Design:** Shared recipient bar (phone/group JID) at top; tabbed form selector for all 12 message types below.
- **Endpoints:**
  - `POST /send/message`: Plaintext message with optional reply JID.
  - `POST /send/image`: File upload or direct URL with caption and compression toggle.
  - `POST /send/file`: Document upload with MIME type detection.
  - `POST /send/video`: Video upload with view-once toggle.
  - `POST /send/sticker`: WebP sticker uploader.
  - `POST /send/contact`: Contact card (`name`, `phone`).
  - `POST /send/link`: URL preview generator with custom caption.
  - `POST /send/location`: Coordinate picker (`latitude`, `longitude`).
  - `POST /send/audio`: Voice note player/uploader with PTT (Push-to-Talk) switch.
  - `POST /send/poll`: Dynamic poll question with up to 12 selectable options.
  - `POST /send/presence`: Sets availability state (`available` / `unavailable`).
  - `POST /send/chat-presence`: Emits typing (`composing`) or recording pulse.
- **Schedule Drawer:** Allows scheduling any send request with a future execution timestamp.

### Phase 5: Scheduled Send Manager (`/scheduled`)

- **Visual Design:** Data table of queued broadcasts with status badges (`PENDING`, `COMPLETED`, `PAUSED`, `FAILED`).
- **Endpoints:**
  - `GET /send/schedules`: Lists scheduled sends with status and message type filters.
  - `GET /send/schedules/:id`: Inspects scheduled payload details.
  - `POST /send/schedules/:id/pause`: Temporarily halts execution.
  - `POST /send/schedules/:id/resume`: Resumes paused schedule.
  - `POST /send/schedules/:id/cancel`: Cancels scheduled task.

### Phase 6: Group Command Center (`/groups`)

- **Visual Design:** Master-detail group browser with participants table, admin role tags, and management action buttons.
- **Endpoints:**
  - `POST /group`: Modal for creating new group with initial participants.
  - `POST /group/join-with-link`: Joins group from WhatsApp invite URL.
  - `GET /group/info-from-link`: Inspects group info before joining.
  - `GET /group/info`: Fetches metadata and permission settings.
  - `GET /group/participants`: Displays participants table with roles.
  - `GET /group/participants/export`: Triggers direct CSV download of all members.
  - `POST /group/participants`: Adds members.
  - `POST /group/participants/remove`: Removes members.
  - `POST /group/participants/promote` & `demote`: Changes admin status.
  - `GET` & `POST /group/participant-requests/*`: Manages join request queue.
  - `POST /group/photo`: Updates group avatar.
  - `POST /group/name`: Changes group title.
  - `POST /group/topic`: Changes group description.
  - `POST /group/locked`: Toggles restriction on editing group info.
  - `POST /group/announce`: Toggles announcement mode (only admins can send).
  - `GET /group/invite-link`: Displays or resets invite link.
  - `POST /group/leave`: Leaves group.

### Phase 7: Account, Contacts & Newsletters (`/account`, `/misc`)

- **Visual Design:** Tabbed settings card with push name editor, avatar uploader, privacy matrix, contact directory, and channel browser.
- **Endpoints:**
  - `POST /user/pushname`: Updates profile display name.
  - `GET` & `POST /user/avatar`: Inspects and updates profile picture.
  - `GET /user/my/privacy`: Displays privacy settings table.
  - `GET /user/my/contacts`: Lists address book entries.
  - `GET /user/check`: Real-time phone number WhatsApp validation tool.
  - `GET /user/business-profile`: Displays business catalog and metadata.
  - `GET /user/my/newsletters`: Lists joined channels.
  - `GET /newsletter/messages`: Browses newsletter feed.
  - `POST /newsletter/unfollow`: Unfollows channel.
  - `POST /call/reject`: Rejects incoming audio/video calls.

---

## 4. Single-Server Deployment Architecture

```
                      Build Time (Local / CI)
                      -----------------------
    React 19 + Vite + TypeScript ---> npm run build
                                           |
                                  dist/index.html (1.2 MB)
                                           |
                    +----------------------+----------------------+
                    |                                             |
             Manual Copy                                  GitHub Release
                    |                                             |
         storages/ui/index.html                     Asset: gowa-ui.html
                    |                                             |
                    +----------------------+----------------------+
                                           |
                                           v
                               Production VPS Server
                               ---------------------
                           GoWA Go Binary (Port 3000)
                                           |
                              uiasset.LoadCache()
                                           |
                               Serves UI at "/"
```

### Steps to Run Single-Server Mode:

1. Run `npm run build` in `golangwaui` to produce `dist/index.html`.
2. Deploy the single Go binary `gowanew` to the VPS.
3. Place `dist/index.html` at `storages/ui/index.html` in the Go working directory (or rely on `APP_UI_AUTO_UPDATE=true` to download it automatically from GitHub releases).
4. Run `./gowanew rest`. The application serves the entire API and UI from a single port without Node.js.
