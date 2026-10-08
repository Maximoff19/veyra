# Veyra API curl reference

Use these commands to call the backend API that reads and writes database records. They do **not** connect directly to the database or execute SQL.

## Scope and safety

- Covers all 22 operations used by the frontend, plus a request for the Swagger document. The additional declared payment route is explained separately because its request contract cannot be verified from this checkout.
- Sources: `src/lib/api-contract.ts`, `src/lib/forms.ts`, `src/lib/domain.ts` and the request calls in pages/components.
- Live Swagger retrieval was attempted on October 7, 2026, but the backend connection timed out. These examples are code-verified, not live endpoint tests; additional backend operations may exist.
- **POST, PATCH, PUT and DELETE commands can change stored data.** Run them individually against a test environment, not as a bulk script.
- All example identities, passwords and payloads are fictional. Replace example IDs with records from your own test environment.
- The configured backend uses HTTP. Neither the local proxy nor a Vercel rewrite encrypts the proxy-to-backend connection. Do not send real credentials, personal information or payment data until backend TLS is enabled.

## 1. Configure your terminal

Commands use Bash-compatible syntax and require curl. Run `bun run dev` in another terminal when using the local Vite proxy.

```bash
# Default: the local frontend proxy, which forwards /api to the backend.
API_BASE_URL='http://localhost:5173/api'

# Alternative for public reads with fictional/test data only:
# API_BASE_URL='http://20.106.154.149/api'

# For a secured test API, replace the base with its trusted HTTPS URL.
# Do not append a trailing slash.

# Copy the token returned by a successful test login or registration.
TOKEN='REPLACE_WITH_TEST_USER_TOKEN'
ADMIN_TOKEN='REPLACE_WITH_AUTHORIZED_TEST_ADMIN_TOKEN'

# Example IDs only: replace them with existing records before making requests.
PACKAGE_ID='37'
CATEGORY_ID='9'
HOTEL_ID='43'
USER_ID='10'
RESERVATION_ID='20'
REVIEW_ID='1'
```

`--fail-with-body` returns an unsuccessful exit code for HTTP errors while preserving the response body. `--silent --show-error` hides the progress meter but keeps transport errors visible. If your curl does not support `--fail-with-body`, use `--fail` instead; the error body may then be hidden.

There are two distinct credentials in the examples: `TOKEN` for an ordinary test user and `ADMIN_TOKEN` for an authorized administrator. Hiding an admin control in the frontend is not authorization; the backend must enforce access.

## 2. Operation index

Paths below are relative to `API_BASE_URL`, which already includes `/api`.

| Method | Path | Access used by the frontend | Effect |
| --- | --- | --- | --- |
| GET | `/paquetes` | Public | List and filter packages |
| GET | `/paquetes/:id` | Public | Read a package |
| GET | `/categorias` | Public | List categories |
| GET | `/hoteles` | Public | List hotels |
| GET | `/paquetes/:id/itinerario` | Public | Read an itinerary |
| GET | `/paquetes/:packageId/resenas` | Public | Read package reviews |
| POST | `/auth/registro` | Public | Create an account |
| POST | `/auth/login` | Public | Obtain a session token |
| GET | `/auth/me` | Bearer token | Read the current identity |
| PATCH | `/usuarios/:id` | Bearer token | Update profile fields |
| POST | `/reservas` | Bearer token | Create a reservation |
| GET | `/reservas` | Bearer token | List reservations |
| GET | `/reservas/:id` | Bearer token | Read reservation details |
| PATCH | `/reservas/:id/cancelar` | Bearer token | Cancel an eligible reservation |
| POST | `/paquetes/:packageId/resenas` | Bearer token | Create a review |
| PUT | `/resenas/:id` | Bearer token | Edit an authorized review |
| DELETE | `/resenas/:id` | Bearer token | Delete an authorized review |
| POST | `/categorias` | Admin token | Create a category |
| POST | `/hoteles` | Admin token | Create a hotel |
| POST | `/paquetes` | Admin token | Create a package |
| POST | `/paquetes/:packageId/itinerario` | Admin token | Add an itinerary entry |
| PATCH | `/paquetes/:packageId/cupos` | Admin token | Adjust available spots |

## 3. Public catalog reads

### List packages

```bash
curl --fail-with-body --silent --show-error --get "$API_BASE_URL/paquetes" \
  --header 'Accept: application/json' \
  --data-urlencode 'limit=12' \
  --data-urlencode 'offset=0'
```

### Search and combine catalog filters

Remove filters you do not need. `--data-urlencode` handles spaces and other special characters in search text.

```bash
curl --fail-with-body --silent --show-error --get "$API_BASE_URL/paquetes" \
  --header 'Accept: application/json' \
  --data-urlencode 'q=Cusco' \
  --data-urlencode "id_categoria=$CATEGORY_ID" \
  --data-urlencode "id_hotel=$HOTEL_ID" \
  --data-urlencode 'disponibles=true' \
  --data-urlencode 'limit=12' \
  --data-urlencode 'offset=0'
```

| Parameter | Frontend behavior |
| --- | --- |
| `q` | Non-empty, trimmed search text |
| `id_categoria` | Category filter |
| `id_hotel` | Hotel filter |
| `disponibles` | Forwarded only when its value is `true` |
| `limit` | Integer from 1 to 100; defaults to 12 |
| `offset` | Non-negative integer; defaults to 0 |

For the next page, use `offset=12`, then `offset=24`, and so on. curl does not apply `pageQuery()` validation; keep these parameters within the bounds used by the frontend.

### Read a package

```bash
curl --fail-with-body --silent --show-error "$API_BASE_URL/paquetes/$PACKAGE_ID" \
  --header 'Accept: application/json'
```

### List categories

```bash
curl --fail-with-body --silent --show-error "$API_BASE_URL/categorias" \
  --header 'Accept: application/json'
```

### List hotels

```bash
curl --fail-with-body --silent --show-error "$API_BASE_URL/hoteles" \
  --header 'Accept: application/json'
```

### Read a package itinerary

```bash
curl --fail-with-body --silent --show-error "$API_BASE_URL/paquetes/$PACKAGE_ID/itinerario" \
  --header 'Accept: application/json'
```

### Read package reviews

```bash
curl --fail-with-body --silent --show-error "$API_BASE_URL/paquetes/$PACKAGE_ID/resenas" \
  --header 'Accept: application/json'
```

## 4. Authentication and profile

### Register a fictional test user — creates an account

```bash
curl --fail-with-body --silent --show-error --request POST "$API_BASE_URL/auth/registro" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data-binary '{"nombre":"Test Traveler","email":"traveler@example.com","password":"Fictional-Test-Password-2026","telefono":"+10000000000"}'
```

`telefono` is optional and may be omitted. The frontend requires at least eight Unicode code points and at most 72 UTF-8 bytes for registration passwords. The backend may enforce additional rules. Use a unique fictional test email if an account already exists.

### Log in with the test account

```bash
curl --fail-with-body --silent --show-error --request POST "$API_BASE_URL/auth/login" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data-binary '{"email":"traveler@example.com","password":"Fictional-Test-Password-2026"}'
```

The session decoder expects a `token` and `usuario` in successful authentication responses. Copy the test token into `TOKEN`; do not commit or share actual response tokens. For administrative calls, use a token from an already authorized test administrator; these examples do not create or assign roles.

### Read the authenticated user

```bash
curl --fail-with-body --silent --show-error "$API_BASE_URL/auth/me" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $TOKEN"
```

Use the returned `id_usuario` as `USER_ID` when updating your own profile.

### Update profile — changes personal fields

```bash
curl --fail-with-body --silent --show-error --request PATCH "$API_BASE_URL/usuarios/$USER_ID" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer $TOKEN" \
  --data-binary '{"nombre":"Updated Test Traveler","email":"updated-traveler@example.com","telefono":"+10000000001"}'
```

Send only changed fields. The frontend allows `nombre`, `email` and `telefono`; it does not submit passwords or roles in this operation.

To remove the phone number:

```bash
curl --fail-with-body --silent --show-error --request PATCH "$API_BASE_URL/usuarios/$USER_ID" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer $TOKEN" \
  --data-binary '{"telefono":null}'
```

There is no logout endpoint declared by this frontend. Its logout clears the local token; it does not demonstrate server-side token revocation. Clear terminal placeholders after use with `unset TOKEN ADMIN_TOKEN`.

## 5. Reservations

### Create a reservation — can consume available spots

```bash
curl --fail-with-body --silent --show-error --request POST "$API_BASE_URL/reservas" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer $TOKEN" \
  --data-binary @- <<JSON
{"items":[{"id_paquete":$PACKAGE_ID,"cantidad_pasajeros":2}]}
JSON
```

This heredoc assumes a numeric package ID. If the backend uses text IDs, put a valid JSON string in `id_paquete` instead. Do not interpolate arbitrary user-supplied text into JSON.

The payload supports an `items` array with 1–100 entries; each entry contains `id_paquete` and an integer `cantidad_pasajeros` from 1 to 10,000. These are frontend validation bounds, not a guarantee that stock is available. The backend determines prices, totals and reservation state. Never submit client-calculated `total_pagar`, prices or status.

Creating a reservation does not perform a payment. Copy its returned `id_reserva` into `RESERVATION_ID` before reading or cancelling it.

### List reservations

```bash
curl --fail-with-body --silent --show-error --get "$API_BASE_URL/reservas" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $TOKEN" \
  --data-urlencode 'limit=12' \
  --data-urlencode 'offset=0'
```

The frontend uses a summary decoder for this list. It does not assume that list entries include all package items or payment details.

### Read reservation details and recorded payments

```bash
curl --fail-with-body --silent --show-error "$API_BASE_URL/reservas/$RESERVATION_ID" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $TOKEN"
```

The detail decoder reads `items` and `pagos`. A missing `pagos` field means payment information is unknown, not that there are no payments. No separate payment-list endpoint is declared in the frontend.

### Cancel a reservation — changes reservation state

```bash
curl --fail-with-body --silent --show-error --request PATCH "$API_BASE_URL/reservas/$RESERVATION_ID/cancelar" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $TOKEN"
```

The frontend sends no JSON body. It only enables this action when the reservation is `pendiente` and the detail confirms no payments. The backend must check eligibility and ownership again; refresh the detail after any cancellation attempt.

## 6. Reviews

### Create a review — writes a record

```bash
curl --fail-with-body --silent --show-error --request POST "$API_BASE_URL/paquetes/$PACKAGE_ID/resenas" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer $TOKEN" \
  --data-binary '{"calificacion":5,"comentario":"Fictional test review."}'
```

Use an integer rating from 1 to 5. The backend decides whether the user is eligible to review the package. Copy the returned `id_resena` into `REVIEW_ID`.

### Edit a review — changes a record

```bash
curl --fail-with-body --silent --show-error --request PUT "$API_BASE_URL/resenas/$REVIEW_ID" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer $TOKEN" \
  --data-binary '{"calificacion":4,"comentario":"Updated fictional test review."}'
```

The frontend uses **PUT**, not PATCH, for review edits. The backend enforces ownership or other authorized access.

### Delete a review — removes a record

```bash
curl --fail-with-body --silent --show-error --request DELETE "$API_BASE_URL/resenas/$REVIEW_ID" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $TOKEN"
```

A successful response may be `204 No Content`; an empty body is not necessarily an error.

## 7. Administrative writes

These commands require an authorized test administrator. They are not part of the public read flow.

### Create a category

```bash
curl --fail-with-body --silent --show-error --request POST "$API_BASE_URL/categorias" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer $ADMIN_TOKEN" \
  --data-binary '{"nombre_categoria":"Test Adventure","descripcion":"Fictional category for API testing."}'
```

`nombre_categoria` is required; `descripcion` is optional. Copy the returned category ID before creating a package.

### Create a hotel

```bash
curl --fail-with-body --silent --show-error --request POST "$API_BASE_URL/hoteles" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer $ADMIN_TOKEN" \
  --data-binary '{"nombre":"Test Hotel","ubicacion":"Test Location","capacidad_disponible":20}'
```

`nombre` and `ubicacion` are required. `capacidad_disponible` is optional; the form documents a backend default of 0. This field is not a room-inventory model. Copy the returned hotel ID before creating a package.

### Create a package

```bash
curl --fail-with-body --silent --show-error --request POST "$API_BASE_URL/paquetes" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer $ADMIN_TOKEN" \
  --data-binary @- <<JSON
{"id_categoria":$CATEGORY_ID,"id_hotel":$HOTEL_ID,"titulo":"Fictional Test Package","descripcion":"Test data only.","precio":367.50,"stock_cupos":10,"fecha_inicio":"2027-10-02","fecha_fin":"2027-10-06"}
JSON
```

This example assumes numeric category and hotel IDs. Use valid JSON strings for text IDs instead, and use actual catalog references. Required fields are `id_categoria`, `id_hotel`, `titulo`, `precio`, `stock_cupos`, `fecha_inicio` and `fecha_fin`; `descripcion` is optional. Spots must be an integer. Dates must be real `YYYY-MM-DD` days, with the end date equal to or later than the start date. Choose appropriate future dates for your test.

The frontend contract does not identify a currency and its admin form does not send image or licensing fields. Do not assume such write fields are supported without checking Swagger.

### Add an itinerary entry

```bash
curl --fail-with-body --silent --show-error --request POST "$API_BASE_URL/paquetes/$PACKAGE_ID/itinerario" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer $ADMIN_TOKEN" \
  --data-binary '{"dia_numero":1,"titulo_actividad":"Test arrival","descripcion_actividad":"Fictional itinerary entry."}'
```

`dia_numero` and `titulo_actividad` are required; `descripcion_actividad` is optional. The package ID belongs in the URL, not the body.

### Increase available spots

```bash
curl --fail-with-body --silent --show-error --request PATCH "$API_BASE_URL/paquetes/$PACKAGE_ID/cupos" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer $ADMIN_TOKEN" \
  --data-binary '{"ajuste":3}'
```

### Decrease available spots

```bash
curl --fail-with-body --silent --show-error --request PATCH "$API_BASE_URL/paquetes/$PACKAGE_ID/cupos" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer $ADMIN_TOKEN" \
  --data-binary '{"ajuste":-2}'
```

`ajuste` is a non-zero integer delta, not the new absolute stock. Negative values reduce spots. The backend decides whether an adjustment is valid for the current state.

## 8. Declared payment route — request contract unverified

`src/lib/api-contract.ts` declares `demoPayment` at `/reservas/:id/pagos`. However, the current payment modal is **frontend-only**: it sends no payment request and persists no payment form fields. The existing decoder expects a simulated response with `simulado: true`, `metodo_pago: "demo"` and `estado_pago: "aprobado_demo"`; those are **response fields**, not evidence of the accepted request body.

No executable payment curl is provided because the method, request fields and backend side effects cannot be confirmed from current call sites or live Swagger. Verify those details before using this route. Do not invent a card-payment payload or send card numbers, expiration dates or CVV values.

## 9. Inspect Swagger and diagnose failures

### Retrieve the backend API document

```bash
curl --fail-with-body --silent --show-error --connect-timeout 10 --max-time 30 \
  "$API_BASE_URL/docs.json" \
  --header 'Accept: application/json'
```

Use its `paths`, HTTP methods, request schemas and security definitions to identify additional operations not used by the frontend. This request timed out against the configured backend during preparation of this document.

### Inspect a public response status and headers

```bash
curl --fail-with-body --silent --show-error --include --connect-timeout 10 --max-time 30 \
  "$API_BASE_URL/paquetes" \
  --header 'Accept: application/json'
```

| Result | What to check |
| --- | --- |
| Connection timeout | Backend availability, address, port, network rules; start Vite when using the local base |
| 401 | Missing, invalid or expired bearer token |
| 403 | Backend permission checks; a token does not grant administrator access by itself |
| 404 | API base, route and record ID |
| Other 4xx | Read the actual backend message; do not assume every conflict is a stock problem |
| 204 | Successful operation with no response body may be expected |
| 5xx | Backend failure, or proxy upstream failure; inspect the response and server logs |

Do not automatically retry writes after a timeout: a record may have been created even if the response was lost. Read the relevant resource before deciding whether to repeat the operation.

## 10. Boundaries of this reference

- No direct database connection, SQL endpoint or database credentials are defined in this frontend.
- No extra category/hotel/package update or delete endpoints, role-management endpoints, password-reset endpoints or server logout endpoint are inferred.
- No real payment flow is implemented here.
- curl does not execute frontend decoders or validation helpers. Inspect backend responses and follow backend rules even when using the same sample fields.
- Successful parsing by the frontend is not proof that all backend operations are documented. A complete backend-wide reference requires the live Swagger document or backend source.
