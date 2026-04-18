-- CampusXpress helper functions

create or replace function public.calculate_carbon_saved(material text, weight numeric)
returns numeric
language sql
immutable
as $$
  select case
    when material = 'plastic' then round(weight * 2.5, 2)
    when material = 'paper' then round(weight * 1.5, 2)
    when material = 'metal' then round(weight * 3.0, 2)
    else 0
  end;
$$;

create or replace function public.haversine_distance_km(
  from_lat double precision,
  from_lng double precision,
  to_lat double precision,
  to_lng double precision
)
returns double precision
language sql
immutable
as $$
  select 6371 * 2 * atan2(
    sqrt(
      sin(radians((to_lat - from_lat) / 2)) ^ 2 +
      cos(radians(from_lat)) * cos(radians(to_lat)) * sin(radians((to_lng - from_lng) / 2)) ^ 2
    ),
    sqrt(1 - (
      sin(radians((to_lat - from_lat) / 2)) ^ 2 +
      cos(radians(from_lat)) * cos(radians(to_lat)) * sin(radians((to_lng - from_lng) / 2)) ^ 2
    ))
  );
$$;

create or replace function public.predict_eta(distance_km double precision, active_orders integer)
returns integer
language sql
immutable
as $$
  select greatest(5, round(distance_km * 2 + active_orders * 5)::integer);
$$;

create or replace function public.compute_order_total(order_uuid uuid)
returns numeric
language sql
stable
as $$
  select coalesce(sum(price * quantity), 0)::numeric
  from public.order_items
  where order_id = order_uuid;
$$;

create or replace function public.redeem_points(points_to_redeem integer)
returns table(points_left integer, discount numeric)
language plpgsql
security definer
as $$
declare
  uid uuid := auth.uid();
  current_points integer;
begin
  if uid is null then
    raise exception 'Unauthorized';
  end if;

  if points_to_redeem <= 0 then
    raise exception 'Points must be positive';
  end if;

  select points into current_points from public.profiles where id = uid for update;

  if current_points is null then
    raise exception 'Profile not found';
  end if;

  if current_points < points_to_redeem then
    raise exception 'Insufficient points';
  end if;

  update public.profiles
  set points = points - points_to_redeem
  where id = uid;

  insert into public.wallet_transactions(user_id, type, points, note)
  values (uid, 'redeem', points_to_redeem, 'Checkout points redemption');

  return query
  select p.points, round((points_to_redeem::numeric / 100), 2)
  from public.profiles p
  where p.id = uid;
end;
$$;
