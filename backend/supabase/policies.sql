-- CampusXpress RLS policies

alter table public.profiles enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_chat_messages enable row level security;
alter table public.recycling_requests enable row level security;
alter table public.tasks enable row level security;
alter table public.task_stops enable row level security;
alter table public.rent_items enable row level security;
alter table public.rental_requests enable row level security;
alter table public.rental_messages enable row level security;
alter table public.books enable row level security;

-- Helpers
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists(
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create or replace function public.is_partner_or_admin()
returns boolean
language sql
stable
as $$
  select exists(
    select 1 from public.profiles p where p.id = auth.uid() and p.role in ('partner', 'admin')
  );
$$;

-- profiles
create policy profiles_select_self_or_admin on public.profiles
for select
using (id = auth.uid() or public.is_admin());

create policy profiles_insert_self on public.profiles
for insert
with check (id = auth.uid());

create policy profiles_update_self_or_admin on public.profiles
for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

-- wallet_transactions
create policy wallet_select_owner_or_admin on public.wallet_transactions
for select
using (user_id = auth.uid() or public.is_admin());

create policy wallet_insert_owner_or_admin on public.wallet_transactions
for insert
with check (user_id = auth.uid() or public.is_admin());

-- orders
create policy orders_select_owner_or_ops on public.orders
for select
using (user_id = auth.uid() or public.is_partner_or_admin());

create policy orders_insert_owner on public.orders
for insert
with check (user_id = auth.uid());

create policy orders_update_owner_or_ops on public.orders
for update
using (user_id = auth.uid() or public.is_partner_or_admin())
with check (user_id = auth.uid() or public.is_partner_or_admin());

-- order_items
create policy order_items_select_linked_order on public.order_items
for select
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and (o.user_id = auth.uid() or public.is_partner_or_admin())
  )
);

create policy order_items_insert_linked_order on public.order_items
for insert
with check (
  exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = auth.uid()
  )
);

create policy order_items_update_linked_order on public.order_items
for update
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id and (o.user_id = auth.uid() or public.is_partner_or_admin())
  )
);

-- order_chat_messages
create policy order_chat_select_participants on public.order_chat_messages
for select
using (
  exists (
    select 1
    from public.orders o
    left join public.tasks t on t.order_id = o.id
    where o.id = order_id
      and (
        o.user_id = auth.uid()
        or public.is_admin()
        or (public.is_partner_or_admin() and (t.assigned_to is null or t.assigned_to = auth.uid()))
      )
  )
);

create policy order_chat_insert_participants on public.order_chat_messages
for insert
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.orders o
    left join public.tasks t on t.order_id = o.id
    where o.id = order_id
      and (
        o.user_id = auth.uid()
        or public.is_admin()
        or (public.is_partner_or_admin() and (t.assigned_to is null or t.assigned_to = auth.uid()))
      )
  )
);

-- recycling_requests
create policy recycling_select_owner_or_ops on public.recycling_requests
for select
using (user_id = auth.uid() or public.is_partner_or_admin());

create policy recycling_insert_owner on public.recycling_requests
for insert
with check (user_id = auth.uid());

create policy recycling_update_owner_or_ops on public.recycling_requests
for update
using (user_id = auth.uid() or public.is_partner_or_admin())
with check (user_id = auth.uid() or public.is_partner_or_admin());

-- tasks
create policy tasks_select_ops_or_order_owner on public.tasks
for select
using (
  public.is_partner_or_admin()
  or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);

create policy tasks_insert_ops on public.tasks
for insert
with check (public.is_partner_or_admin());

create policy tasks_insert_owner_targets on public.tasks
for insert
with check (
  public.is_partner_or_admin()
  or (
    order_id is not null
    and exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  )
  or (
    recycling_id is not null
    and exists (
      select 1 from public.recycling_requests r
      where r.id = recycling_id and r.user_id = auth.uid()
    )
  )
);

create policy tasks_update_ops on public.tasks
for update
using (public.is_partner_or_admin())
with check (public.is_partner_or_admin());

-- task_stops
create policy task_stops_select_if_task_visible on public.task_stops
for select
using (
  exists (
    select 1 from public.tasks t
    left join public.orders o on o.id = t.order_id
    where t.id = task_id
      and (public.is_partner_or_admin() or o.user_id = auth.uid())
  )
);

create policy task_stops_mutation_ops on public.task_stops
for all
using (public.is_partner_or_admin())
with check (public.is_partner_or_admin());

create policy task_stops_insert_owner_or_ops on public.task_stops
for insert
with check (
  public.is_partner_or_admin()
  or exists (
    select 1
    from public.tasks t
    left join public.orders o on o.id = t.order_id
    left join public.recycling_requests r on r.id = t.recycling_id
    where t.id = task_id
      and (o.user_id = auth.uid() or r.user_id = auth.uid())
  )
);

-- rent_items
create policy rent_items_select_all_authenticated on public.rent_items
for select
using (auth.uid() is not null);

create policy rent_items_insert_owner on public.rent_items
for insert
with check (owner_id = auth.uid());

create policy rent_items_update_owner on public.rent_items
for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy rent_items_delete_owner on public.rent_items
for delete
using (owner_id = auth.uid());

-- rental_requests
create policy rental_requests_select_participants on public.rental_requests
for select
using (lender_id = auth.uid() or renter_id = auth.uid() or public.is_admin());

create policy rental_requests_insert_renter on public.rental_requests
for insert
with check (renter_id = auth.uid());

create policy rental_requests_update_participants on public.rental_requests
for update
using (lender_id = auth.uid() or renter_id = auth.uid() or public.is_admin())
with check (lender_id = auth.uid() or renter_id = auth.uid() or public.is_admin());

-- rental_messages
create policy rental_messages_select_participants on public.rental_messages
for select
using (
  exists (
    select 1 from public.rental_requests rr
    where rr.id = rental_request_id
      and (rr.lender_id = auth.uid() or rr.renter_id = auth.uid() or public.is_admin())
  )
);

create policy rental_messages_insert_participants on public.rental_messages
for insert
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.rental_requests rr
    where rr.id = rental_request_id
      and (rr.lender_id = auth.uid() or rr.renter_id = auth.uid() or public.is_admin())
  )
);

-- books
create policy books_select_all_authenticated on public.books
for select
using (auth.uid() is not null);
