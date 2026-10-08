# Veyra frontend + / 

React, TypeScript and Vite tourism-package frontend connected to the verified API at `http://20.106.154.149/api`.

## Run locally

```sh
bun install --frozen-lockfile
bun run dev
```

Open `http://localhost:5173`. The app defaults to `/api`; Vite proxies this path to the backend. `VITE_API_BASE_URL` may override it with another trusted HTTPS API.

## Connected flows

For request examples, see [the curl API reference](CURL_API.md). It covers frontend-known operations and flags routes whose request contracts could not be verified.

- Package catalog with search, category/hotel filters, availability and pagination.
- Package details, associated hotel/category, separate itineraries and public reviews.
- Registration, login, `/auth/me`, profile updates and server-validated session restoration.
- Reservation creation, summary lists, details and cancellation.
- Review creation, PUT edits and deletion by authorized users.
- Existing admin creation forms for categories, hotels, packages, itineraries and capacity adjustments. Backend permissions remain authoritative; other admin CRUD screens are not implemented.

## Edit the interface

- `src/main.tsx` controls routes, the shared header/footer and the nine home sections. Remove a section's JSX call to hide it; no import change is needed.
- `src/components/HomeSections.tsx` contains the home section content. `Header.tsx` and `Footer.tsx` contain the shared navigation and footer.
- `src/styles.css` contains component styles, with Spanish comments identifying each section. `src/lib/photos.ts` contains editorial images.
- If you remove the hero section, set the header's `heroOnHome` prop to `false`. Removing a route also requires reviewing links and its lazy declaration.

## Payment demonstration

`PaymentModal.tsx` is a frontend-only form for fictional data. Fields are not read, serialized, transmitted or persisted and are reset on close or completion. Native browser validation requires the fields before confirmation.

Completing the form shows **Paid · demo** in the reservation detail and marks the visual payment step complete. This is a local boolean, not a server payment: it resets when the detail is unmounted or the page reloads, and the reservation list continues to show server data. No money moves, no payment API is called and no paid status is written to the backend. Server state changes take precedence over the local demonstration.

## Verification and deployment

```sh
bun test
bun run build
vercel --prod
```

`vercel.json` proxies `/api/*` before the SPA fallback, preserves backend paths and disables API caching. Client-side links support direct navigation. No credentials belong in `VITE_*` variables or deployment configuration.

**Transport limitation:** the browser-to-Vercel connection is HTTPS, but the supplied backend is HTTP. The proxy prevents browser mixed-content/CORS blocks; it does not encrypt the Vercel-to-backend connection. Enable backend TLS before using real credentials or personal data in production.

Only the bearer token is stored in per-tab `sessionStorage`; identity and role are restored through `/auth/me` after a reload. Passwords and payment fields are never stored. Prices have no currency symbol because Swagger does not identify a currency. Backend cancellation remains limited to pending reservations with verified absence of payments; the local paid demonstration hides cancellation until the detail is reopened.
