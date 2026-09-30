# Flow Builder

A small chatbot flow builder: an automation flow (trigger → business hours → messages → comments) is rendered as a node graph you can rearrange, extend, link, edit and delete, with undo/redo and a URL-addressable details drawer for every node.

Built with **Vue 3, Vite, Vue Flow, TanStack Query, Pinia and Vue Router**, plain JavaScript.

---

## Contents

- [Features](#features)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Architecture](#architecture)
- [Design decisions](#design-decisions)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Testing](#testing)
- [CI](#ci)
- [Known limitations & next steps](#known-limitations--next-steps)

---

## Features

**Canvas**
- Renders the flow payload as a top-down tree with Vue Flow; edges are coloured by the node they come from.
- Drag nodes anywhere; positions are saved, so later edits never snap them back.
- Link nodes by dragging from a node's bottom handle to another node's top handle. Invalid links (loops, into the trigger, into Success/Failure, …) are refused while dragging.
- Minimap, zoom controls and background grid.

**Nodes**
- Each card shows a type icon, type label, title and a description truncated to two lines. Send Message cards also show an attachment count.
- When no description has been written, one is derived from the node's data (first message text, the comment, or a business-hours summary such as `Mon–Sun · 09:00–17:00 · UTC`).
- Success/Failure branches render as small pills and are display-only.

**Create New Node**
- Dialog with title, description and type (Send Message, Add Comment, Business Hours), validated before submit.
- The new node appears in the centre of the current view. A Business Hours node comes with its Success/Failure branches.

**Details drawer**
- Opens by clicking a node or pressing **Enter** on a focused node; clicking the same node, the empty canvas, ✕ or **Esc** closes it.
- Addressable by URL (`/?node=<id>`); **Back** closes it, and unknown ids are removed from the URL.
- The camera glides so the opened node sits in the middle of the canvas left of the drawer.
- Title and description are editable for every node, plus per type:
  - **Send Message:** edit, add and remove texts; attachments as image tiles with remove; upload by browse or drag-and-drop (PNG/JPG, ≤ 5 MB).
  - **Add Comment:** edit or clear the comment.
  - **Business Hours:** timezone select, and per day an open/closed switch with start/end times via a time picker.
- **Autosave**: valid changes save ~0.4 s after you stop typing; the footer shows *Saving…*, *All changes saved*, or *N errors to fix before saving*.
- **Delete** with a confirmation dialog and an Undo action in the toast.

**Undo / redo**
- Every change (create, link, move, edit, delete) is one undo step. Header buttons are disabled when there is nothing to undo/redo; keyboard shortcuts are listed [below](#keyboard-shortcuts).

---

## Getting started

### Prerequisites

- **Node.js** `^22.18.0` or `>=24.12.0` (see `engines` in `package.json`)
- **pnpm** (developed with pnpm 12)

### Install and run

```sh
pnpm install
pnpm dev
```

Open the URL Vite prints (by default <http://localhost:5173>).

### Production build

```sh
pnpm build     # outputs to dist/
pnpm preview   # serves dist/ locally
```

---

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Start the Vite dev server with hot reload |
| `pnpm build` | Production build into `dist/` |
| `pnpm preview` | Serve the production build locally |
| `pnpm test:unit` | Run Vitest in watch mode |
| `pnpm test:unit --run` | Run the test suite once (what CI runs) |
| `pnpm lint` | Run oxlint then ESLint, **fixing** what they can |
| `pnpm format` | Format `src/` with Prettier |

---

## Project structure

```
payload.json                 Local copy of the API payload (see "Data source")
src/
├── api/flow.js              Loads the payload and normalizes legacy node types
├── config/query.js          QueryClient config (from the brief) and query keys
├── constants/
│   ├── nodeTypes.js         Per-type label, icon and colour tone; legacy type map
│   └── layout.js            Drawer size and camera animation timing
├── stores/tracking.js       Pinia store: undo/redo history
├── router/index.js          Single canvas route (+ catch-all redirect)
├── pages/HomePage.vue       The canvas page: wires Vue Flow, query, mutations, drawer
├── composables/
│   ├── useFlowQuery.js      useQuery for the flow (fetch + initial layout)
│   ├── useFlowMutations.js  create / connect / move / update / delete (+ history)
│   ├── useFlowHistory.js    undo/redo actions and keyboard shortcuts
│   ├── useNodeDrawer.js     Keeps the open node in sync with the URL (?node=)
│   └── useConnectionValidator.js  Shares the link rules with node handles
├── components/
│   ├── flow/                FlowNode (card) and ConnectorNode (Success/Failure pill)
│   ├── header/              FloatingHeader (undo/redo + Create New Node)
│   ├── modal/               NewNode (create dialog) and NodeDetail (details drawer)
│   ├── detail/              Per-type drawer sections (messages, comment, business hours)
│   ├── form/TimePicker.vue  flatpickr-based 24-hour time input
│   └── ui/                  Vendored JLDS design-system components (see below)
├── utils/                   Pure logic, all unit-tested:
│   ├── flowTransform.js       payload → Vue Flow nodes/edges, tree layout
│   ├── flowNormalize.js       legacy type → current type
│   ├── flowConnect.js         link rules and re-parenting
│   ├── flowEdit.js            delete (re-attach children) and patch a node
│   ├── nodeFactory.js         build new nodes with unique ids and default data
│   ├── nodeSummary.js         card titles/descriptions, business-hours summary
│   ├── nodeForm.js            create-form validation
│   ├── nodeDetail.js          drawer draft ↔ node conversion and validation
│   ├── time.js                HH:mm validation
│   ├── viewport.js            camera target for "centre the node beside the drawer"
│   └── canvasEvents.js        keyboard decisions (Enter to open, arrow-key moves)
└── __tests__/               Unit and component tests (mirrors src/)
```

---

## Architecture

### Where each kind of state lives

| State | Owner | Why |
|---|---|---|
| The flow (nodes, their data, positions) | **TanStack Query cache** (`['flow']`) | It is *server state*: data that would belong to a backend. Query is the store for it. |
| Undo/redo history | **Pinia** (`tracking` store) | Client-only state shared by the header, shortcuts, mutations and delete toast. |
| Which node's drawer is open | **URL** (`?node=<id>`) | Linkable, and the browser's Back button works for free. |
| Unsaved drawer edits, dialog open/closed | **Component state** (`ref`) | Only one component cares. |
| Selection, zoom, pan | **Vue Flow** internals | Already tracked; not duplicated. |

### Data flow

```
payload.json ─fetchFlow()─▶ normalizeFlow ─▶ applyLayout ─▶ Query cache ['flow']
                                                              │        ▲
                                         toFlowElements()     │        │ setQueryData(next)
                                                              ▼        │
                                       Vue Flow canvas / drawer   commit(update)
                                                              │        ▲
                                                 user action  └──▶ useMutation (create, connect,
                                                                    move, update, delete)
                                                                          │
                                                        previous flow ──▶ Pinia history
```

1. **Load.** `useFlowQuery` runs once: the payload is fetched, legacy types are renamed, and every node gets an initial tree-layout position. With `staleTime: Infinity` it is never refetched, so the cache becomes the working copy of the document.
2. **Render.** `toFlowElements` turns the cached items into Vue Flow nodes and edges (an edge per `parentId`).
3. **Change.** Every change is a `useMutation`. Its `mutationFn` plays the server (builds the node, checks link rules…), and `onSuccess` calls one shared `commit(update)` helper that:
   - computes the next flow **immutably** (unchanged nodes keep their identity),
   - records the previous flow in the Pinia history (skipped when nothing changed),
   - writes the next flow with `queryClient.setQueryData`.
4. **Undo/redo** swaps whole-flow snapshots between the history stacks and the cache. Snapshots are cheap because unchanged nodes are shared between versions (capped at 100 steps).

With a real backend, only the `mutationFn`s would change (to `fetch` calls); components, the cache and undo/redo stay as they are.

### The details drawer

The drawer never edits the cache directly. It works on a **draft** (`utils/nodeDetail.js`):

```
node ─toDraft─▶ draft (form-friendly) ─validateDraft─▶ errors
                    │ valid & changed, after 400 ms
                    ▼
               draftToPatch ─▶ updateNode mutation
```

- The draft reshapes data for editing: a message's mixed `payload` list becomes separate `texts` and `attachments` lists; business hours become all seven days with an `open` flag (closed days are simply absent from the payload's `times`).
- An unedited draft converts back to exactly the original data, so "nothing changed" is detected reliably and no empty saves are made.
- Pending edits are saved before switching to another node or closing. If the open node changes from outside (undo/redo), the drawer reloads, so it never saves stale values over an undo.

---

## Design decisions

### Data source: local copy of the API payload

The brief's endpoint (`…/candidate-assessments/payload.json` on S3) **cannot be fetched from a browser**: the bucket sends no CORS headers for any origin. Requests from `localhost` on any port (3000, 5173, 8080, …) and from `127.0.0.1` get no `Access-Control-Allow-Origin` header, and the CORS preflight returns `403`. That is a server-side setting the frontend can't change.

So `src/api/flow.js` returns a local copy of the same payload (`payload.json`, the same data as the S3 response). It stays async and goes through TanStack Query, so nothing else in the app knows the difference. Once the bucket allows CORS (or a backend proxies it), `fetchFlow()` becomes a `fetch()` of the URL and no other code changes.

### TanStack Query holds the flow; Pinia holds the history

The brief asks to use Query "for data fetching **and mutation updates**" and Pinia "for storing data". The flow data is treated as server state and kept in the Query cache, with mutations updating it through `setQueryData`. This follows TanStack's own guidance not to copy server state into a client store, which would create two copies to keep in sync:

- [Does TanStack Query replace Vuex, Pinia or other global state managers?](https://tanstack.com/query/latest/docs/framework/vue/guides/does-this-replace-client-state)
- [Updates from Mutation Responses](https://tanstack.com/query/latest/docs/framework/vue/guides/updates-from-mutation-responses)

Pinia stores the client-only state: the undo/redo history (`src/stores/tracking.js`).

Mutations write into the cache instead of invalidating and refetching, because a refetch would reload the original payload and wipe every edit. The brief's `staleTime: Infinity` points the same way.

### Legacy `dateTime` type → `businessHours`

The payload types the business-hours node as `dateTime`, while the create form's type is `businessHours`. `dateTime` is treated as a **legacy key**: `normalizeFlow` renames it once, when the payload loads (`LEGACY_NODE_TYPES` in `constants/nodeTypes.js`). The rest of the app only knows `businessHours`, and new nodes are created with it. `dateTimeConnector` (the Success/Failure pills) is a different type and is left unchanged.

### Positions are part of the saved data

The payload has no coordinates, so a tree layout (`layoutTree`) assigns positions once, on load. From then on positions are stored with each node and only change when the user moves a node. That keeps linking, creating or undoing from shuffling unrelated nodes around. New nodes are placed at the centre of the current view.

### Open node in the query string

The open node lives in `?node=<id>` rather than a path such as `/node/:id`. The canvas stays on a single route, so opening, switching or closing the drawer never re-mounts the Vue Flow canvas. The drawer's open state is **derived** from the URL (`useNodeDrawer`), never stored separately.

### Tree rules for linking and deleting

The flow is a tree (`parentId`), so linking A → B makes A the parent of B, re-parenting B if it already had one. Links are refused if they would:

- connect a node to itself;
- point into the trigger;
- point into a Success/Failure pill;
- start from Business Hours directly (branch from its Success or Failure pill instead);
- duplicate an existing link;
- create a loop.

Deleting a node re-attaches its children to its parent, so the rest of the flow stays connected. Deleting Business Hours also removes its Success/Failure pills.

The rules are checked on the node **handles** while dragging, and again inside the mutation before saving. They are deliberately *not* passed to `<VueFlow :is-valid-connection>`: Vue Flow also runs that global check against every existing edge whenever edges change, which silently dropped all existing links (an existing link always fails "already connected").

### Validation

| Field | Rules |
|---|---|
| Title (create + drawer) | required, ≤ 60 characters |
| Description | optional, ≤ 200 characters |
| Node type (create) | required, one of the three creatable types |
| Message text | not empty, ≤ 1000 characters |
| Comment | ≤ 500 characters (may be empty: the brief allows removing it) |
| Business hours | timezone required; for open days both times in 24-hour `HH:mm`, end after start |
| Attachments | PNG or JPG, ≤ 5 MB; rejected files show a warning toast |

In the create dialog, errors appear after the first submit and then update live. In the drawer, errors show immediately and block autosave until fixed.

### Business hours use a time picker

The brief asks for a date time picker. The payload stores hours **per weekday** (`{ day: 'mon', startTime, endTime }`) and never a calendar date, so the picker is time-only: flatpickr in 24-hour `HH:mm` mode (`components/form/TimePicker.vue`), themed with the design-system tokens. Typing is still allowed for keyboard users, and validation covers typed values.

### UI kit: vendored JLDS components, plus custom pieces

UI primitives (button, dialog, drawer, field, input, select, textarea, toast, …) come from **JLDS**, a design system whose CLI copies component source into `src/components/ui/`. Being vendored source, they were adapted where needed:

- **Drawer** gained a non-modal mode (`:modal="false"`): no backdrop or scroll lock, so the canvas stays interactive beside it.
- **Input / Select / Textarea** now set `inheritAttrs: false`. Previously attributes like `id` landed on both the wrapper and the native field, which broke `<label for>` and programmatic focus.

`src/components/ui/` is excluded from linting as third-party code.

Custom-built pieces: the canvas node cards and branch pills, the tree layout, the undo/redo engine, the attachment tiles and drop zone, the business-hours day switch and time picker wrapper, and the drawer's draft/autosave logic.

### Smooth canvas ↔ drawer transitions

- The drawer slides in without covering or dimming the canvas, and the header shifts left so it stays visible.
- Opening a node animates the camera (400 ms) so the node is centred in the visible area left of the drawer, at the current zoom.
- Clicking another node while the drawer is open switches its content in place; there is no close/reopen.

---

## Keyboard shortcuts

| Keys | Action |
|---|---|
| <kbd>Tab</kbd> | Move focus between nodes (focused node shows a ring) |
| <kbd>Enter</kbd> on a node | Open its details drawer |
| <kbd>Arrow keys</kbd> on a selected node | Move it (hold <kbd>Shift</kbd> for bigger steps); moves are saved |
| <kbd>Esc</kbd> | Close the drawer or dialog |
| <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Z</kbd> | Undo |
| <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd>, or <kbd>Ctrl</kbd> + <kbd>Y</kbd> | Redo |

Undo/redo shortcuts are ignored while typing in a field, so the browser's own text undo keeps working there.

---

## Testing

```sh
pnpm test:unit --run
```

Vitest with `@vue/test-utils` in jsdom. The suite covers:

- **Pure logic** (`src/utils/*`): layout, normalization, link rules, delete/patch, node factory, card summaries, both forms' validation, time validation, camera maths, keyboard decisions.
- **Store and composables:** undo/redo stacks and limits; history recording in every mutation; undo/redo against the query cache; keyboard shortcuts; URL ↔ drawer sync (invalid ids, toggle, Back, deleted node).
- **Components:** node card and branch pill, create dialog (validation, reset, focus), header (disabled states, undo/redo), the drawer (autosave, errors, switching nodes, external changes, delete confirmation), each drawer section (texts, uploads and rejections, clear comment, day switches), and the time picker.

`src/__tests__/setup.js` replaces Iconify's `Icon` with a stub so tests never fetch icons over the network. The canvas page itself isn't mounted in tests, since Vue Flow needs browser layout APIs jsdom lacks. Its decision logic lives in `utils/canvasEvents.js` and `utils/viewport.js`, which are tested directly.

---

## CI

`.github/workflows/test.yml` runs on pushes and pull requests to `main`:

1. Install with pnpm (`--frozen-lockfile`) on Node 24
2. oxlint and ESLint, **without** `--fix`, so problems fail the build
3. The test suite (`pnpm test:unit --run`)
4. A production build

---

## Known limitations & next steps

- **No persistence.** Edits live in memory (the Query cache), so a reload restores the original payload and clears undo history. The next step is a real API behind the existing `mutationFn`s, or persisting the cache to storage.
- **Uploaded images are object URLs**, valid only for the current session.
- **With a real, slow API**, mutations would become [optimistic updates](https://tanstack.com/query/latest/docs/framework/vue/guides/optimistic-updates) (update in `onMutate`, roll back in `onError`).
- **Trigger settings** (`conversationOpened`, `oncePerContact`) aren't shown in its drawer yet.
- **Focus management:** opening the drawer with Enter leaves focus on the node. Moving focus into the drawer (and back on close) would improve keyboard flow.
- **Dragging a node doesn't move its children.**
- **Each arrow-key press** is its own undo step.
