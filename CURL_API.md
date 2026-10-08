# Veyra API: complete curl testing reference

Use these commands to call the backend API that reads and writes database records. They do **not** connect directly to the database or execute SQL.

## Scope and safety

- Covers all **40 operations** in the live Swagger document, plus documentation retrieval and diagnostic examples.
- Source of backend methods, payloads and permissions: `http://20.106.154.149/api/docs.json`, API version **1.1.0**, retrieved on **October 8, 2026**. Frontend behavior is additionally documented from `src/lib/api-contract.ts`, `src/lib/forms.ts` and `src/lib/domain.ts`.
- Live checks returned HTTP 200 for health, package/category/hotel lists, package 40 details, itinerary, reviews, search, combined filters and Swagger. `/auth/me` and `/reservas` returned the expected HTTP 401 without a token. Authenticated and write operations below are Swagger-verified examples, **not executed tests**.
- **POST, PATCH, PUT and DELETE commands can change stored data.** Run them individually against a test environment, not as a bulk script.
- All example identities, passwords and payloads are fictional. Replace example IDs with records from your own test environment.
- The configured backend uses HTTP. Neither the local proxy nor a Vercel rewrite encrypts the proxy-to-backend connection. Do not send real credentials, personal information or payment data until backend TLS is enabled.

## Quick start: public reads only

1. Set the variables in section 1.
2. Run health and catalog requests in section 3.
3. For login and writes, switch to a secured test API or a verified SSH tunnel first. Use only disposable test accounts and records.

**Do not paste the entire document into a terminal.** Run one request at a time. The mutation examples are not a cleanup script and must not target existing customer records.

## 1. Configure your terminal

Commands use Bash-compatible syntax and require curl. They also work in zsh. Every curl below contains the real backend URL, `http://20.106.154.149/api`; no base-URL variable or local frontend is required. Only tokens and resource IDs need to be set.

```bash
# Copy the token returned by a successful test login or registration.
TOKEN='REPLACE_WITH_TEST_USER_TOKEN'
ADMIN_TOKEN='REPLACE_WITH_AUTHORIZED_TEST_ADMIN_TOKEN'

# Verified public-read IDs on October 8, 2026. Do not mutate these records.
PACKAGE_ID='40'
CATEGORY_ID='3'
HOTEL_ID='46'

# Set these from your own test responses before authenticated requests.
USER_ID='REPLACE_WITH_TEST_USER_ID'
RESERVATION_ID='REPLACE_WITH_TEST_RESERVATION_ID'
REVIEW_ID='REPLACE_WITH_TEST_REVIEW_ID'
ITINERARY_ID='REPLACE_WITH_TEST_ITINERARY_ID'
```

`--fail-with-body` returns an unsuccessful exit code for HTTP errors while preserving the response body. `--silent --show-error` hides the progress meter but keeps transport errors visible. If your curl does not support `--fail-with-body`, use `--fail` instead; the error body may then be hidden.

There are two distinct credentials in the examples: `TOKEN` for an ordinary test user and `ADMIN_TOKEN` for an authorized administrator. Hiding an admin control in the frontend is not authorization; the backend must enforce access.

If HTTPS is unavailable, an authorized SSH tunnel can protect traffic from your machine to the server. After confirming the correct SSH username and access, run this in a separate terminal:

```bash
ssh -N -L 127.0.0.1:8080:127.0.0.1:80 YOUR_SSH_USER@20.106.154.149
```

To use the tunnel, replace `http://20.106.154.149/api` with `http://127.0.0.1:8080/api` in the curl you run. The literal public URLs below do not automatically use the tunnel. This assumes the backend is reachable on the server's loopback port 80; verify `/health` through the tunnel first. Alternatively, replace the public HTTP base with your trusted HTTPS test API URL. Do not put an SSH password in this document or command line. A plain Vite proxy is **not** an encrypted tunnel.

All resource IDs in Swagger are positive integers up to 2,147,483,647. Before writes, replace `CATEGORY_ID`, `HOTEL_ID` and `PACKAGE_ID` with IDs of **disposable records you created**, not the public-read defaults above.

## 2. Operation index

Paths below are relative to `http://20.106.154.149/api`. The executable examples include this full base URL.

| Method | Path | Access documented by Swagger | Effect |
| --- | --- | --- | --- |
| GET | `/health` | Public | Check API and database health |
| GET | `/paquetes` | Public | List and filter packages |
| GET | `/paquetes/:id` | Public | Read a package |
| GET | `/categorias` | Public | List categories |
| GET | `/categorias/:id` | Public | Read a category |
| GET | `/hoteles` | Public | List hotels |
| GET | `/hoteles/:id` | Public | Read a hotel |
| GET | `/paquetes/:id/itinerario` | Public | Read an itinerary |
| GET | `/paquetes/:packageId/resenas` | Public | Read package reviews |
| POST | `/auth/registro` | Public | Create an account |
| POST | `/auth/login` | Public | Obtain a session token |
| GET | `/auth/me` | Bearer token | Read the current identity |
| GET | `/roles` | Admin token | List roles |
| GET | `/usuarios` | Admin token | List users |
| GET | `/usuarios/:id` | Owner or admin token | Read a user |
| PATCH | `/usuarios/:id` | Owner or admin token | Update profile fields |
| POST | `/reservas` | Bearer token | Create a reservation |
| GET | `/reservas` | Bearer token | List reservations |
| GET | `/usuarios/:id/reservas` | Owner or admin token | List a user's reservations |
| GET | `/reservas/:id` | Owner or admin token | Read reservation details |
| PATCH | `/reservas/:id/cancelar` | Owner or admin token | Cancel an eligible reservation |
| GET | `/reservas/:id/pagos` | Owner or admin token | Read reservation payments |
| POST | `/reservas/:id/pagos` | Owner or admin token | Record a simulated payment if enabled |
| GET | `/pagos` | Admin token | List all payments |
| POST | `/paquetes/:packageId/resenas` | Bearer token | Create a review |
| PUT | `/resenas/:id` | Author token | Edit your review |
| DELETE | `/resenas/:id` | Author or admin token | Delete a review |
| POST | `/categorias` | Admin token | Create a category |
| PUT | `/categorias/:id` | Admin token | Update a category |
| DELETE | `/categorias/:id` | Admin token | Delete a category |
| POST | `/hoteles` | Admin token | Create a hotel |
| PUT | `/hoteles/:id` | Admin token | Update a hotel |
| DELETE | `/hoteles/:id` | Admin token | Delete a hotel |
| POST | `/paquetes` | Admin token | Create a package |
| PUT | `/paquetes/:id` | Admin token | Update a package without reservation details |
| DELETE | `/paquetes/:id` | Admin token | Delete a package and its itineraries/reviews |
| POST | `/paquetes/:packageId/itinerario` | Admin token | Add an itinerary entry |
| PUT | `/itinerarios/:id` | Admin token | Update an itinerary entry |
| DELETE | `/itinerarios/:id` | Admin token | Delete an itinerary entry |
| PATCH | `/paquetes/:packageId/cupos` | Admin token | Adjust available spots |

## 3. Public catalog reads

### Check API and database health

```bash
curl --fail-with-body --silent --show-error --connect-timeout 5 --max-time 15 \
  "http://20.106.154.149/api/health" \
  --header 'Accept: application/json'
```

Verified result: HTTP 200 with `estado: "ok"` and `base_datos: "conectada"`. The response also contains `hora_actual`.

### List packages

```bash
curl --fail-with-body --silent --show-error --get "http://20.106.154.149/api/paquetes" \
  --header 'Accept: application/json' \
  --data-urlencode 'limit=12' \
  --data-urlencode 'offset=0'
```

### Search and combine catalog filters

Remove filters you do not need. `--data-urlencode` handles spaces and other special characters in search text.

```bash
curl --fail-with-body --silent --show-error --get "http://20.106.154.149/api/paquetes" \
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
| `q` | Non-empty, trimmed search text; Swagger searches title or hotel location; maximum 150 characters |
| `id_categoria` | Category filter |
| `id_hotel` | Hotel filter |
| `disponibles` | `true` requires positive stock and a start date not before the MySQL date |
| `limit` | Integer from 1 to 100; defaults to 12 |
| `offset` | Non-negative integer; defaults to 0 |

For the next page, use `offset=12`, then `offset=24`, and so on. curl does not apply `pageQuery()` validation; keep these parameters within the bounds used by the frontend.

An empty array is a valid response. For example, package 40 started before the live test date, so filtering its category/hotel with `disponibles=true` returned `[]` despite its positive stock. Swagger's list default is `limit=100`; these examples deliberately request smaller pages.

### Read a package

```bash
curl --fail-with-body --silent --show-error "http://20.106.154.149/api/paquetes/$PACKAGE_ID" \
  --header 'Accept: application/json'
```

### List categories

```bash
curl --fail-with-body --silent --show-error "http://20.106.154.149/api/categorias" \
  --header 'Accept: application/json'
```

### List hotels

```bash
curl --fail-with-body --silent --show-error "http://20.106.154.149/api/hoteles" \
  --header 'Accept: application/json'
```

### Read a package itinerary

```bash
curl --fail-with-body --silent --show-error "http://20.106.154.149/api/paquetes/$PACKAGE_ID/itinerario" \
  --header 'Accept: application/json'
```

### Read package reviews

```bash
curl --fail-with-body --silent --show-error "http://20.106.154.149/api/paquetes/$PACKAGE_ID/resenas" \
  --header 'Accept: application/json'
```

## 4. Authentication and profile

### Register a fictional test user — creates an account

```bash
curl --fail-with-body --silent --show-error --request POST "http://20.106.154.149/api/auth/registro" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data-binary '{"nombre":"Test Traveler","email":"traveler@example.com","password":"Fictional-Test-Password-2026","telefono":"+10000000000"}'
```

`telefono` is optional and may be omitted. The frontend requires at least eight Unicode code points and at most 72 UTF-8 bytes for registration passwords. The backend may enforce additional rules. Use a unique fictional test email if an account already exists.

### Log in with the test account

```bash
curl --fail-with-body --silent --show-error --request POST "http://20.106.154.149/api/auth/login" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data-binary '{"email":"traveler@example.com","password":"Fictional-Test-Password-2026"}'
```

The session decoder expects a `token` and `usuario` in successful authentication responses. Copy the test token into `TOKEN`; do not commit or share actual response tokens. For administrative calls, use a token from an already authorized test administrator; these examples do not create or assign roles.

### Read the authenticated user

```bash
curl --fail-with-body --silent --show-error "http://20.106.154.149/api/auth/me" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $TOKEN"
```

Use the returned `id_usuario` as `USER_ID` when updating your own profile.

### Update profile — changes personal fields

```bash
curl --fail-with-body --silent --show-error --request PATCH "http://20.106.154.149/api/usuarios/$USER_ID" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer $TOKEN" \
  --data-binary '{"nombre":"Updated Test Traveler","email":"updated-traveler@example.com","telefono":"+10000000001"}'
```

Send only changed fields. The frontend allows `nombre`, `email` and `telefono`; it does not submit passwords or roles in this operation.

To remove the phone number:

```bash
curl --fail-with-body --silent --show-error --request PATCH "http://20.106.154.149/api/usuarios/$USER_ID" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer $TOKEN" \
  --data-binary '{"telefono":null}'
```

There is no logout endpoint declared by this frontend. Its logout clears the local token; it does not demonstrate server-side token revocation. Clear terminal placeholders after use with `unset TOKEN ADMIN_TOKEN`.

## 5. Reservations

### Create a reservation — can consume available spots

```bash
curl --fail-with-body --silent --show-error --request POST "http://20.106.154.149/api/reservas" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer $TOKEN" \
  --data-binary @- <<JSON
{"items":[{"id_paquete":$PACKAGE_ID,"cantidad_pasajeros":2}]}
JSON
```

This heredoc requires a numeric test package ID, as specified by Swagger. Do not interpolate arbitrary user-supplied text into JSON.

The payload supports an `items` array with 1–100 entries; each entry contains `id_paquete` and an integer `cantidad_pasajeros` from 1 to 10,000. These are frontend validation bounds, not a guarantee that stock is available. The backend determines prices, totals and reservation state. Never submit client-calculated `total_pagar`, prices or status.

Creating a reservation does not perform a payment. Copy its returned `id_reserva` into `RESERVATION_ID` before reading or cancelling it.

Swagger states that pending reservations do not expire automatically: their spots remain reserved until cancellation. For a reversible test, create a reservation and cancel it **without recording a payment**.

### List reservations

```bash
curl --fail-with-body --silent --show-error --get "http://20.106.154.149/api/reservas" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $TOKEN" \
  --data-urlencode 'limit=12' \
  --data-urlencode 'offset=0'
```

The frontend uses a summary decoder for this list. It does not assume that list entries include all package items or payment details.

### Read reservation details and recorded payments

```bash
curl --fail-with-body --silent --show-error "http://20.106.154.149/api/reservas/$RESERVATION_ID" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $TOKEN"
```

The detail decoder reads `items` and `pagos`. A missing `pagos` field means payment information is unknown, not that there are no payments. No separate payment-list endpoint is declared in the frontend.

### Cancel a reservation — changes reservation state

```bash
curl --fail-with-body --silent --show-error --request PATCH "http://20.106.154.149/api/reservas/$RESERVATION_ID/cancelar" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $TOKEN"
```

The frontend sends no JSON body. It only enables this action when the reservation is `pendiente` and the detail confirms no payments. The backend must check eligibility and ownership again; refresh the detail after any cancellation attempt.

## 6. Reviews

### Create a review — writes a record

```bash
curl --fail-with-body --silent --show-error --request POST "http://20.106.154.149/api/paquetes/$PACKAGE_ID/resenas" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer $TOKEN" \
  --data-binary '{"calificacion":5,"comentario":"Fictional test review."}'
```

Use an integer rating from 1 to 5. According to Swagger, login is required, prior purchase is not required, and multiple reviews are allowed. Copy the returned `id_resena` into `REVIEW_ID`. `comentario` is optional, nullable, and limited to 10,000 characters.

### Edit a review — changes a record

```bash
curl --fail-with-body --silent --show-error --request PUT "http://20.106.154.149/api/resenas/$REVIEW_ID" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer $TOKEN" \
  --data-binary '{"calificacion":4,"comentario":"Updated fictional test review."}'
```

The frontend uses **PUT**, not PATCH, for review edits. The backend enforces ownership or other authorized access.

### Delete a review — removes a record

```bash
curl --fail-with-body --silent --show-error --request DELETE "http://20.106.154.149/api/resenas/$REVIEW_ID" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $TOKEN"
```

A successful response may be `204 No Content`; an empty body is not necessarily an error.

## 7. Administrative writes

These commands require an authorized test administrator. They are not part of the public read flow.

### Create a category

```bash
curl --fail-with-body --silent --show-error --request POST "http://20.106.154.149/api/categorias" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer $ADMIN_TOKEN" \
  --data-binary '{"nombre_categoria":"Test Adventure","descripcion":"Fictional category for API testing."}'
```

`nombre_categoria` is required; `descripcion` is optional. Copy the returned category ID before creating a package.

### Create a hotel

```bash
curl --fail-with-body --silent --show-error --request POST "http://20.106.154.149/api/hoteles" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer $ADMIN_TOKEN" \
  --data-binary '{"nombre":"Test Hotel","ubicacion":"Test Location","capacidad_disponible":20}'
```

`nombre` and `ubicacion` are required. `capacidad_disponible` is optional; the form documents a backend default of 0. This field is not a room-inventory model. Copy the returned hotel ID before creating a package.

### Create a package

```bash
curl --fail-with-body --silent --show-error --request POST "http://20.106.154.149/api/paquetes" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer $ADMIN_TOKEN" \
  --data-binary @- <<JSON
{"id_categoria":$CATEGORY_ID,"id_hotel":$HOTEL_ID,"titulo":"Fictional Test Package","descripcion":"Test data only.","precio":367.50,"stock_cupos":10,"fecha_inicio":"2027-10-02","fecha_fin":"2027-10-06"}
JSON
```

This example requires numeric category and hotel IDs from your own test records. Required fields are `id_categoria`, `id_hotel`, `titulo`, `precio`, `stock_cupos`, `fecha_inicio` and `fecha_fin`; `descripcion` is optional. Price must be positive with at most two decimal places; stock must be a non-negative integer. Dates must be real `YYYY-MM-DD` days, with the end date equal to or later than the start date. Choose appropriate future dates for your test.

The frontend contract does not identify a currency and its admin form does not send image or licensing fields. Do not assume such write fields are supported without checking Swagger.

### Add an itinerary entry

```bash
curl --fail-with-body --silent --show-error --request POST "http://20.106.154.149/api/paquetes/$PACKAGE_ID/itinerario" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer $ADMIN_TOKEN" \
  --data-binary '{"dia_numero":1,"titulo_actividad":"Test arrival","descripcion_actividad":"Fictional itinerary entry."}'
```

`dia_numero` and `titulo_actividad` are required; `descripcion_actividad` is optional. The package ID belongs in the URL, not the body.

### Increase available spots

```bash
curl --fail-with-body --silent --show-error --request PATCH "http://20.106.154.149/api/paquetes/$PACKAGE_ID/cupos" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer $ADMIN_TOKEN" \
  --data-binary '{"ajuste":3}'
```

### Decrease available spots

```bash
curl --fail-with-body --silent --show-error --request PATCH "http://20.106.154.149/api/paquetes/$PACKAGE_ID/cupos" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer $ADMIN_TOKEN" \
  --data-binary '{"ajuste":-2}'
```

`ajuste` is a non-zero integer delta, not the new absolute stock. Negative values reduce spots. The backend decides whether an adjustment is valid for the current state.

## 8. Payments: simulation only

The current frontend payment modal is frontend-only, but live Swagger now verifies a backend simulation endpoint. It does **not** charge money and never accepts card numbers, expiry dates or CVV values.

### Read payments for your test reservation

```bash
curl --fail-with-body --silent --show-error "http://20.106.154.149/api/reservas/$RESERVATION_ID/pagos" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $TOKEN"
```

Access: reservation owner or administrator. Expected success: HTTP 200.

### Record a simulated payment — writes data and confirms the reservation

**Use a separate disposable reservation.** This requires the server to already have `ENABLE_DEMO_PAYMENTS=true`. The current flag value has not been verified; HTTP 403 can mean the feature is disabled. Do not enable it on a production server just to run this example.

```bash
curl --fail-with-body --silent --show-error --request POST "http://20.106.154.149/api/reservas/$RESERVATION_ID/pagos" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer $TOKEN" \
  --data-binary '{"metodo_pago":"demo"}'
```

Swagger specifies HTTP 201 for a new payment and HTTP 200 when returning an existing payment without duplication. The server obtains the amount from the reservation, stores `aprobado_demo`, and confirms the reservation. Do not submit an amount or payment status. The cancellation route does not cancel paid reservations, and the demo has no refund endpoint.

### List all payments — administrator only

```bash
curl --fail-with-body --silent --show-error --get "http://20.106.154.149/api/pagos" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $ADMIN_TOKEN" \
  --data-urlencode 'limit=12' \
  --data-urlencode 'offset=0'
```

## 9. Inspect Swagger and diagnose failures

### Retrieve the backend API document

```bash
curl --fail-with-body --silent --show-error --connect-timeout 10 --max-time 30 \
  "http://20.106.154.149/api/docs.json" \
  --header 'Accept: application/json'
```

Use its `paths`, HTTP methods, request schemas and security definitions to check for contract changes. This request returned HTTP 200 on October 8, 2026.

### Inspect a public response status and headers

```bash
curl --fail-with-body --silent --show-error --include --connect-timeout 10 --max-time 30 \
  "http://20.106.154.149/api/paquetes" \
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

### Verify missing-token rejection without changing data

```bash
# Expected HTTP 401. curl intentionally does not use --fail-with-body here.
curl --silent --show-error --include --connect-timeout 5 --max-time 15 \
  "http://20.106.154.149/api/auth/me" \
  --header 'Accept: application/json'

# Expected HTTP 401.
curl --silent --show-error --include --connect-timeout 5 --max-time 15 \
  "http://20.106.154.149/api/reservas" \
  --header 'Accept: application/json'
```

### Verify a missing package without changing data

```bash
# Expect HTTP 404 only if this valid numeric ID does not exist.
curl --silent --show-error --include --connect-timeout 5 --max-time 15 \
  "http://20.106.154.149/api/paquetes/2147483647" \
  --header 'Accept: application/json'
```

## 10. Additional public and authenticated reads

### Read a category

```bash
curl --fail-with-body --silent --show-error "http://20.106.154.149/api/categorias/$CATEGORY_ID" \
  --header 'Accept: application/json'
```

### Read a hotel

```bash
curl --fail-with-body --silent --show-error "http://20.106.154.149/api/hoteles/$HOTEL_ID" \
  --header 'Accept: application/json'
```

### List roles — administrator only

```bash
curl --fail-with-body --silent --show-error "http://20.106.154.149/api/roles" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $ADMIN_TOKEN"
```

There is no role creation or role-assignment endpoint in this Swagger document. Registration assigns the Client role; it does not create an administrator.

### List users — administrator only

```bash
curl --fail-with-body --silent --show-error --get "http://20.106.154.149/api/usuarios" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $ADMIN_TOKEN" \
  --data-urlencode 'limit=12' \
  --data-urlencode 'offset=0'
```

### Read your test user — owner or administrator

```bash
curl --fail-with-body --silent --show-error "http://20.106.154.149/api/usuarios/$USER_ID" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $TOKEN"
```

### List reservations for your test user — owner or administrator

```bash
curl --fail-with-body --silent --show-error --get "http://20.106.154.149/api/usuarios/$USER_ID/reservas" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $TOKEN" \
  --data-urlencode 'limit=12' \
  --data-urlencode 'offset=0'
```

For owner-or-admin routes, an authorized administrator can substitute `ADMIN_TOKEN`. For `GET /reservas`, a Client sees their own reservations; an administrator sees all reservations. `PUT /resenas/:id` requires the author, not merely an administrator.

### Paginate categories, hotels and reviews

```bash
curl --fail-with-body --silent --show-error --get "http://20.106.154.149/api/categorias" \
  --header 'Accept: application/json' \
  --data-urlencode 'limit=12' \
  --data-urlencode 'offset=0'

curl --fail-with-body --silent --show-error --get "http://20.106.154.149/api/hoteles" \
  --header 'Accept: application/json' \
  --data-urlencode 'limit=12' \
  --data-urlencode 'offset=0'

curl --fail-with-body --silent --show-error --get "http://20.106.154.149/api/paquetes/$PACKAGE_ID/resenas" \
  --header 'Accept: application/json' \
  --data-urlencode 'limit=12' \
  --data-urlencode 'offset=0'
```

## 11. Additional administrative writes — disposable records only

**All requests in this section change or delete records.** Set IDs from your own category, hotel, package and itinerary creation responses. Never run these against the public-read IDs from section 1.

### Update a category

```bash
curl --fail-with-body --silent --show-error --request PUT "http://20.106.154.149/api/categorias/$CATEGORY_ID" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer $ADMIN_TOKEN" \
  --data-binary '{"nombre_categoria":"Updated Test Adventure","descripcion":"Updated fictional test category."}'
```

### Update a hotel

```bash
curl --fail-with-body --silent --show-error --request PUT "http://20.106.154.149/api/hoteles/$HOTEL_ID" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer $ADMIN_TOKEN" \
  --data-binary '{"nombre":"Updated Test Hotel","ubicacion":"Test Location","capacidad_disponible":25}'
```

Hotel capacity is informational; it does not calculate nightly occupancy.

### Update a package

```bash
curl --fail-with-body --silent --show-error --request PUT "http://20.106.154.149/api/paquetes/$PACKAGE_ID" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer $ADMIN_TOKEN" \
  --data-binary @- <<JSON
{"id_categoria":$CATEGORY_ID,"id_hotel":$HOTEL_ID,"titulo":"Updated Fictional Test Package","descripcion":"Test data only.","precio":"395.00","stock_cupos":10,"fecha_inicio":"2027-10-02","fecha_fin":"2027-10-06"}
JSON
```

Supply all required package fields, not a partial PATCH payload. Swagger specifies HTTP 409 if the package already has reservation details, to preserve history. Use the separate stock-adjustment route when appropriate.

### Update an itinerary entry

Copy the `id_itinerario` from your test itinerary creation response into `ITINERARY_ID`.

```bash
curl --fail-with-body --silent --show-error --request PUT "http://20.106.154.149/api/itinerarios/$ITINERARY_ID" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer $ADMIN_TOKEN" \
  --data-binary '{"dia_numero":2,"titulo_actividad":"Updated test activity","descripcion_actividad":"Fictional itinerary update."}'
```

Multiple activities may share a day number. Expected success for each PUT above: HTTP 200.

### Delete an itinerary entry

```bash
curl --fail-with-body --silent --show-error --include --request DELETE "http://20.106.154.149/api/itinerarios/$ITINERARY_ID" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $ADMIN_TOKEN"
```

### Delete a package — also deletes its itineraries and reviews

**Destructive:** Swagger documents cascading deletion of itineraries and reviews. A package with reservations is not eligible for deletion. Do not assume cancelling a reservation removes its historical details.

```bash
curl --fail-with-body --silent --show-error --include --request DELETE "http://20.106.154.149/api/paquetes/$PACKAGE_ID" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $ADMIN_TOKEN"
```

### Delete a hotel

```bash
curl --fail-with-body --silent --show-error --include --request DELETE "http://20.106.154.149/api/hoteles/$HOTEL_ID" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $ADMIN_TOKEN"
```

### Delete a category

```bash
curl --fail-with-body --silent --show-error --include --request DELETE "http://20.106.154.149/api/categorias/$CATEGORY_ID" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $ADMIN_TOKEN"
```

Successful deletes return HTTP 204 with no body. Referenced records can produce HTTP 409. For catalog-only test records with no reservations, delete the package before its hotel/category. Keep reservation/payment test fixtures separate: this API has no reservation, payment or user deletion routes for complete cleanup.

## 12. Suggested test order and expected statuses

1. **Read-only smoke test:** health → lists → a real package → itinerary/reviews → Swagger → missing-token checks.
2. **Disposable Client account:** registration → login → set `TOKEN` → `/auth/me` → set `USER_ID` → profile reads/updates. Use a unique fictional email. Registration returns 201; login and profile operations return 200.
3. **Disposable catalog fixture, with an existing authorized administrator:** create category → set `CATEGORY_ID` → create hotel → set `HOTEL_ID` → create package → set `PACKAGE_ID` → add itinerary → set `ITINERARY_ID`. Creates return 201.
4. **Catalog updates/cleanup:** use a package that has never had reservations. Test its updates, itinerary changes and deletions before deleting its category/hotel.
5. **Reservation test, on a separate fixture:** create → set `RESERVATION_ID` → list/detail → cancel without paying → verify returned spots. Creation returns 201; reads/cancellation return 200. Pending spots do not expire automatically.
6. **Review test:** create → set `REVIEW_ID` → edit as the author → delete as author/admin. Expected statuses: 201 → 200 → 204.
7. **Optional payment simulation, on another reservation:** only if already enabled. POST accepts exactly the demonstrated `metodo_pago: "demo"` field; verify reservation payments afterward. This fixture cannot be cancelled through the pending-unpaid cancellation route.

Do not automatically retry mutations on transport errors. Read the resource first to determine whether the request already succeeded. Dates in sample payloads are examples; choose future dates appropriate for your test date.

Before ending a terminal session:

```bash
unset TOKEN ADMIN_TOKEN
```

## 13. Boundaries of this reference

- No direct database connection, SQL endpoint or database credentials are defined in this frontend.
- All 40 operations in the retrieved Swagger document have curl examples above. No role-assignment, password-reset, logout, user deletion, reservation deletion, payment deletion or refund endpoint is documented there.
- No real payment flow is implemented here.
- curl does not execute frontend decoders or validation helpers. Inspect backend responses and follow backend rules even when using the same sample fields.
- Swagger verifies the documented contract, not that every operation succeeds with your current account/data. Public smoke tests do not prove authenticated flows or writes work. Re-fetch Swagger if the deployed API changes.
