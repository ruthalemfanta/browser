# Wonderly — how to build with this library

Wonderly is a kid-safe browser with two products, and each has its own look:

- **Kids' browser**: playful, chunky. Unbounded display type, 1.5px ink outlines, hard offset shadows, sky/lime/pink/sun fills.
- **Parent site**: calm and admin-like. White cards on warm paper, black primary buttons, plus a loud marketing landing page.

## 1. Always wrap in the right surface

All styles are scoped. A component renders unstyled unless it sits inside its surface:

| Surface | Wraps |
|---|---|
| `<BrowserSurface>` (`.wonderly-browser`) | `BrowserApp`, `HomePage`, `BlockedPage`, `BackgroundPicker`, `PairSetup` |
| `<ParentsSurface>` (`.wonderly-parents`) | `Dashboard`, `DevicePanel`, `AddDevice`, `DeviceSettings`, `ActivityLog`, `ListEditor`, `Card`, `Toggle`, `AuthPage`, `Link`, `Landing`, `BrowserMock` |

The two surfaces reuse class names with different styles. `.primary` is a pink pill in the browser and a black button on the parent site. Never put a browser component inside `ParentsSurface`, or the other way round.

## 2. Data comes from `DemoBackend`

`BrowserApp`, `Dashboard`, `DevicePanel`, `ActivityLog`, `AuthPage` and `AddDevice` load their own data, from Electron (`window.browserAPI`) or the parent server (`/api/*`). A built-in fake answers both with realistic defaults: 2 devices, 2 pending requests, an allowlist policy and a home tab. To show a different state, wrap the screen in `<DemoBackend …>`:

```jsx
const { DemoBackend, BrowserSurface, BrowserApp } = window.Wonderly;
<DemoBackend browser={{ activeTabId: 2, tabs: [
  { id: 1, title: "PBS KIDS Games", url: "https://pbskids.org/games", loading: false, showingPage: true, blocked: null },
  { id: 2, title: "minecraft.net", url: "https://minecraft.net/", loading: false, showingPage: false,
    blocked: { url: "https://minecraft.net/", host: "minecraft.net", reason: "not-allowed" } } ] }}>
  <BrowserSurface><BrowserApp /></BrowserSurface>
</DemoBackend>
```

Useful props:

- `browser.setupRequired: true` shows the pairing lock screen.
- `devices={[]}` shows the first-run "Connect your child's browser" screen.
- `account={null}` signs the parent out.
- `requests`, `policy` and `log` override the dashboard data.

The backend is global state, so use **one** `DemoBackend` per screen. When a tab is showing a page (`showingPage: true`), `BrowserApp` leaves the page area empty, because the real page is a native view. Put your own mock page content below the header if you need it.

Presentational components take plain props and need no backend: `HomePage`, `BlockedPage` (`info.reason` sets the copy and icon), `ListEditor`, `Card`, `Toggle`.

## 3. Styling idiom: plain CSS classes and CSS variables

Use the existing classes and tokens for your own layout glue. Inside the matching surface you can use:

- **Tokens, both surfaces:** `var(--ink)`, `var(--muted)`, `var(--line)`, `var(--sky)` `#7CCBF4`, `var(--lime)` `#D9F45F`, `var(--pink)` `#F3A9E9`, `var(--sun)` `#FFD84D`, `var(--danger)`, `var(--display)` (Unbounded, for headings). Body text is DM Sans.
- **Tokens, browser only:** `--paper`, `--soft-line`.
- **Tokens, parent only:** `--accent`, `--accent-soft`, `--mint` (the page background), `--online`.
- **Classes, browser:** `.hero-card`, `.section-chip`, `.places-grid`, `.place-card`, `.place-letter`, `.blocked-card`, `.pin-card`, `.eyebrow`, `.primary` (pink), `.safe-badge`, `.tab`, `.nav-button`, `.address-bar`.
- **Classes, parent:** `.panel` (page column, with an `h1` and `p.lead`), `.card` (use `<Card>`), `.card-hint`, `.setting-row`, `.list-row`, `.row-actions`, `.inline-form`, `.chip-list`/`.chip`, `.empty-note`, `.mode-grid`/`.mode-card`, `.primary` (black), `.ghost`, `.danger-button`, `.form-error`, `.form-note`, `.topbar`, `.sidebar`.
- **Classes, landing page** (global, put them inside a `.lp` root under `ParentsSurface`): `.lp-btn` plus `.lp-lime`/`.lp-pink`/`.lp-sky`, `.lp-wrap`.

The truth lives in `styles.css` → `_ds_bundle.css`. Read the `.wonderly-browser …` and `.wonderly-parents …` rules before inventing anything new.

## 4. Example: a new parent settings page

```jsx
const { ParentsSurface, Card, Toggle, ListEditor } = window.Wonderly;
<ParentsSurface style={{ padding: 24 }}>
  <div className="panel">
    <h1>Screen time</h1>
    <p className="lead">Daily limits for Maya's laptop</p>
    <Card title="Daily limit" hint="Browsing pauses once the limit is reached.">
      <Toggle checked label="Limit weekdays" hint="2 hours on school days." onChange={() => {}} />
    </Card>
    <Card title="Always allowed">
      <ListEditor items={["khanacademy.org"]} onChange={() => {}} placeholder="e.g. pbskids.org" emptyText="Nothing yet." />
    </Card>
  </div>
</ParentsSurface>
```
