# Express to Supabase Route Mapping

This maps your current backend routes to Supabase operations.

## Auth

- `POST /api/auth/signup`
  - Use `supabase.auth.signUp({ email, password })` in frontend.
  - After signup, insert `profiles` row with `id = auth.user.id` and extra fields.

- `POST /api/auth/login`
  - Use `supabase.auth.signInWithPassword({ email, password })`.

- `GET /api/auth/me`
  - Select from `profiles` where `id = auth.uid()`.

- `PATCH /api/auth/me`
  - Update `profiles` with name/phone/language/preferences.

## Orders

- `GET /api/orders/catalog`
  - Keep existing frontend static catalog or move to table.

- `POST /api/orders`
  - Insert into `orders`, then insert `order_items`.
  - Compute ETA using `predict_eta(distance_km, active_orders)`.
  - Credit points in `profiles` and insert `wallet_transactions`.
  - Insert task row in `tasks` and stops in `task_stops`.

- `PATCH /api/orders/:orderId/payment-confirm`
  - Update `orders.payment_status = 'Paid'` if owner.

- `PATCH /api/orders/:orderId/simulate-progress`
  - Move status: `Preparing -> Out for delivery -> Delivered`.

- `GET /api/orders/mine`
  - Select orders by `user_id = auth.uid()` ordered by `created_at desc`.

- `GET /api/orders/:orderId/chat`
  - Select from `order_chat_messages` by `order_id` with join to profiles.

- `POST /api/orders/:orderId/chat`
  - Insert row into `order_chat_messages`.

## Recycling

- `POST /api/recycling`
  - Insert into `recycling_requests`.
  - Compute `carbon_saved = calculate_carbon_saved(material, weight)`.
  - Add wallet points and transactions.
  - Create task in `tasks` + `task_stops`.

- `GET /api/recycling/mine`
  - Select recycling requests for auth user.

## Tasks

- `GET /api/tasks/partner`
  - Partner/admin query `tasks` where status != Completed.

- `GET /api/tasks/by-order/:orderId`
  - Select task by order id with related rows.

- `POST /api/tasks/:taskId/accept`
  - Update task `assigned_to = auth.uid()`, `status = Accepted`.

- `PATCH /api/tasks/:taskId/status`
  - Update task status.
  - If completed, set linked order/recycling status accordingly.

## Dashboard

- `GET /api/dashboard/me`
  - Aggregate from `profiles` and `recycling_requests`.

- `GET /api/dashboard/wallet`
  - Read points and transactions from `profiles` + `wallet_transactions`.

- `POST /api/dashboard/redeem`
  - Call RPC `redeem_points(points_to_redeem)`.

## Books

- `GET /api/books`
  - Select from `books`.

- `POST /api/books/request`
  - Insert order with one `Library` item.

## Rentals

- `GET /api/rent/items`
  - Select from `rent_items` with optional availability filter.

- `POST /api/rent/items`
  - Insert into `rent_items`.

- `PATCH/DELETE /api/rent/items/:id`
  - Owner-only update/delete.

- `POST /api/rent/request`
  - Insert into `rental_requests` and first `rental_messages` row.

- `GET /api/rent/requests`
  - List requests where user is lender or renter.

- `PATCH /api/rent/requests/:id/approve|reject|cancel`
  - Update `rental_requests.status` by role.

- `GET /api/rent/requests/:id/messages`
  - Select `rental_messages` by request id.

- `POST /api/rent/requests/:id/messages`
  - Insert message; if `offered_price_per_day` > 0 update negotiation totals.

## Admin

- `GET /api/admin/orders`
  - Select all orders with owner profile data.

- `GET /api/admin/users`
  - Select profiles for admin dashboard.

- `PATCH /api/admin/orders/:id/priority`
  - Update order priority true.

- `GET /api/admin/analytics`
  - Aggregate counts and sums in SQL views or RPC.
