import { instamartDataset } from "../data/instamartDataset";
import { isSupabaseConfigured, supabase } from "./supabase";

const HUB_LOCATION = { lat: 12.9716, lng: 77.5946 };

const pointsPerKg = {
  plastic: 6,
  paper: 4,
  metal: 5
};

const sizePointsMap = {
  plastic: { "250ml": 1, "500ml": 2, "1L": 4 },
  paper: { sheets: 1, kg: 4 },
  metal: { can: 2, heavy: 5 }
};

const mapProfile = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
  points: row.points,
  phone: row.phone,
  language: row.language,
  preferences: row.preferences || {
    notifications: true,
    darkMode: false,
    accountPreferences: ""
  }
});

const mapOrderItem = (row) => ({
  _id: String(row.id),
  name: row.name,
  category: row.category,
  price: Number(row.price || 0),
  quantity: Number(row.quantity || 1),
  borrowDays: Number(row.borrow_days || 0),
  returnDate: row.return_date || ""
});

const mapOrder = (row, items = [], user = null) => ({
  _id: row.id,
  userId: user
    ? { _id: user.id, name: user.name, email: user.email }
    : row.user_id,
  items,
  status: row.status,
  priority: Boolean(row.priority),
  deliveryType: row.delivery_type,
  scheduledDate: row.scheduled_date,
  scheduledTime: row.scheduled_time,
  preOrderSlot: row.pre_order_slot,
  paymentMethod: row.payment_method,
  paymentStatus: row.payment_status,
  location: {
    lat: row.location_lat,
    lng: row.location_lng,
    address: row.location_address,
    block: row.location_block,
    room: row.location_room
  },
  etaMinutes: row.eta_minutes,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapChatMessage = (row) => ({
  _id: String(row.id),
  senderId: row.profiles
    ? {
        _id: row.profiles.id,
        name: row.profiles.name,
        role: row.profiles.role,
        email: row.profiles.email
      }
    : row.sender_id,
  senderRole: row.sender_role,
  text: row.text,
  createdAt: row.created_at
});

const mapRecycling = (row) => ({
  _id: row.id,
  userId: row.user_id,
  material: row.material,
  itemType: row.item_type,
  quantity: row.quantity,
  sizeType: row.size_type,
  weight: Number(row.weight || 0),
  carbonSaved: Number(row.carbon_saved || 0),
  status: row.status,
  scheduledAt: row.scheduled_at,
  location: {
    lat: row.location_lat,
    lng: row.location_lng,
    address: row.location_address
  },
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapTask = (row, order = null, recycling = null, assignedTo = null) => ({
  _id: row.id,
  orderId: order,
  recyclingId: recycling,
  assignedTo: assignedTo ? { _id: assignedTo.id, name: assignedTo.name, email: assignedTo.email } : row.assigned_to,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapRentItem = (row, owner = null) => ({
  _id: row.id,
  ownerId: owner
    ? { _id: owner.id, name: owner.name, email: owner.email }
    : row.owner_id,
  name: row.name,
  description: row.description,
  category: row.category,
  condition: row.condition,
  location: row.location,
  pricePerDay: Number(row.price_per_day || 0),
  images: row.images || [],
  availability: Boolean(row.availability),
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapRentalMessage = (row) => ({
  _id: String(row.id),
  senderId: row.profiles
    ? { _id: row.profiles.id, name: row.profiles.name, email: row.profiles.email }
    : row.sender_id,
  senderRole: row.sender_role,
  text: row.text,
  offeredPricePerDay: Number(row.offered_price_per_day || 0),
  createdAt: row.created_at
});

const mapRentalRequest = (row, rentItem = null, lender = null, renter = null, messages = []) => ({
  _id: row.id,
  rentItemId: rentItem || row.rent_item_id,
  lenderId: lender ? { _id: lender.id, name: lender.name, email: lender.email } : row.lender_id,
  renterId: renter ? { _id: renter.id, name: renter.name, email: renter.email } : row.renter_id,
  durationDays: Number(row.duration_days || 0),
  negotiatedPricePerDay: Number(row.negotiated_price_per_day || 0),
  totalCost: Number(row.total_cost || 0),
  contact: row.contact || "",
  status: row.status,
  messages,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const asResponse = (data) => ({ data });

const makeError = (message, status = 400) => {
  const error = new Error(message || "Request failed");
  error.response = { status, data: { message: message || "Request failed" } };
  return error;
};

const throwIfSupabaseUnavailable = () => {
  if (!isSupabaseConfigured || !supabase) {
    throw makeError("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.", 500);
  }
};

const unwrap = (result, fallbackMessage = "Database error") => {
  if (result.error) {
    throw makeError(result.error.message || fallbackMessage, 400);
  }
  return result.data;
};

const isNoRowsError = (error) => error?.code === "PGRST116";

const requireAuthUser = async () => {
  throwIfSupabaseUnavailable();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    throw makeError("Unauthorized", 401);
  }
  return data.user;
};

const getMyProfile = async () => {
  const user = await requireAuthUser();
  const profileResult = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profileResult.error) {
    if (isNoRowsError(profileResult.error)) {
      const inserted = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email,
          phone: "",
          role: "user"
        })
        .select("*")
        .single();
      return mapProfile(unwrap(inserted, "Unable to initialize profile"));
    }
    throw makeError(profileResult.error.message, 400);
  }
  return mapProfile(profileResult.data);
};

const requireRole = (profile, ...roles) => {
  if (!roles.includes(profile.role)) {
    throw makeError("Forbidden", 403);
  }
};

const estimateWeight = (material, sizeType, quantity) => {
  if (material === "plastic") {
    if (sizeType === "250ml") return quantity * 0.05;
    if (sizeType === "500ml") return quantity * 0.1;
    if (sizeType === "1L") return quantity * 0.2;
  }
  if (material === "paper") {
    if (sizeType === "sheets") return quantity * 0.01;
    return quantity;
  }
  if (material === "metal") {
    if (sizeType === "can") return quantity * 0.08;
    return quantity * 0.2;
  }
  return quantity;
};

const calculateCarbonSaved = (material, weight) => {
  if (material === "plastic") return Number((weight * 2.5).toFixed(2));
  if (material === "paper") return Number((weight * 1.5).toFixed(2));
  if (material === "metal") return Number((weight * 3.0).toFixed(2));
  return 0;
};

const haversineDistanceKm = (from, to) => {
  const toRadians = (deg) => (deg * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = toRadians((to.lat || 0) - (from.lat || 0));
  const dLng = toRadians((to.lng || 0) - (from.lng || 0));
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.lat || 0)) *
      Math.cos(toRadians(to.lat || 0)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};

const predictEta = ({ distanceKm = 1, activeOrders = 0 }) => {
  const eta = distanceKm * 2 + activeOrders * 5;
  return Math.max(5, Math.round(eta));
};

const shouldMergeTasks = (deliveryLocation, recyclingLocation, thresholdKm = 1.2) => {
  if (!deliveryLocation || !recyclingLocation) return false;
  return haversineDistanceKm(deliveryLocation, recyclingLocation) <= thresholdKm;
};

const createTaskFromOrder = async (orderRow, userId) => {
  const usedRecycling = unwrap(
    await supabase.from("tasks").select("recycling_id").not("recycling_id", "is", null),
    "Unable to check task links"
  );
  const usedSet = new Set(usedRecycling.map((entry) => entry.recycling_id));

  const recyclingRows = unwrap(
    await supabase
      .from("recycling_requests")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "Requested")
      .order("created_at", { ascending: false }),
    "Unable to load recycling requests"
  );

  const pendingRecycling = recyclingRows.find((entry) => !usedSet.has(entry.id));

  const taskPayload = {
    order_id: orderRow.id,
    recycling_id: null,
    status: "Pending"
  };

  if (
    pendingRecycling &&
    shouldMergeTasks(
      { lat: orderRow.location_lat, lng: orderRow.location_lng },
      { lat: pendingRecycling.location_lat, lng: pendingRecycling.location_lng }
    )
  ) {
    taskPayload.recycling_id = pendingRecycling.id;
  }

  const task = unwrap(
    await supabase.from("tasks").insert(taskPayload).select("*").single(),
    "Unable to create delivery task"
  );

  const stops = [
    {
      task_id: task.id,
      kind: "delivery",
      lat: orderRow.location_lat,
      lng: orderRow.location_lng,
      address: orderRow.location_address,
      stop_order: 1
    }
  ];

  if (taskPayload.recycling_id && pendingRecycling) {
    stops.push({
      task_id: task.id,
      kind: "recycling",
      lat: pendingRecycling.location_lat,
      lng: pendingRecycling.location_lng,
      address: pendingRecycling.location_address,
      stop_order: 2
    });
  }

  await unwrap(await supabase.from("task_stops").insert(stops), "Unable to create task stops");
  return task;
};

const createTaskFromRecycling = async (recyclingRow, userId) => {
  const usedOrders = unwrap(
    await supabase.from("tasks").select("order_id").not("order_id", "is", null),
    "Unable to check task links"
  );
  const usedSet = new Set(usedOrders.map((entry) => entry.order_id));

  const orderRows = unwrap(
    await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .neq("status", "Delivered")
      .order("created_at", { ascending: false }),
    "Unable to load orders"
  );

  const pendingOrder = orderRows.find((entry) => !usedSet.has(entry.id));

  const taskPayload = {
    order_id: null,
    recycling_id: recyclingRow.id,
    status: "Pending"
  };

  if (
    pendingOrder &&
    shouldMergeTasks(
      { lat: pendingOrder.location_lat, lng: pendingOrder.location_lng },
      { lat: recyclingRow.location_lat, lng: recyclingRow.location_lng }
    )
  ) {
    taskPayload.order_id = pendingOrder.id;
  }

  const task = unwrap(
    await supabase.from("tasks").insert(taskPayload).select("*").single(),
    "Unable to create recycling task"
  );

  const stops = [];
  if (taskPayload.order_id && pendingOrder) {
    stops.push({
      task_id: task.id,
      kind: "delivery",
      lat: pendingOrder.location_lat,
      lng: pendingOrder.location_lng,
      address: pendingOrder.location_address,
      stop_order: 1
    });
  }

  stops.push({
    task_id: task.id,
    kind: "recycling",
    lat: recyclingRow.location_lat,
    lng: recyclingRow.location_lng,
    address: recyclingRow.location_address,
    stop_order: taskPayload.order_id ? 2 : 1
  });

  await unwrap(await supabase.from("task_stops").insert(stops), "Unable to create task stops");
  return task;
};

const loadOrderItemsByOrderIds = async (orderIds) => {
  if (!orderIds.length) return new Map();

  const rows = unwrap(
    await supabase.from("order_items").select("*").in("order_id", orderIds),
    "Unable to load order items"
  );

  const grouped = new Map();
  rows.forEach((entry) => {
    if (!grouped.has(entry.order_id)) grouped.set(entry.order_id, []);
    grouped.get(entry.order_id).push(mapOrderItem(entry));
  });
  return grouped;
};

const loadProfilesByIds = async (ids) => {
  if (!ids.length) return new Map();
  const rows = unwrap(
    await supabase.from("profiles").select("id,name,email,role").in("id", ids),
    "Unable to load user profiles"
  );

  const map = new Map();
  rows.forEach((entry) => map.set(entry.id, entry));
  return map;
};

const canAccessOrderChat = async (orderId, profile) => {
  const order = unwrap(
    await supabase.from("orders").select("id,user_id").eq("id", orderId).single(),
    "Order not found"
  );

  if (profile.role === "admin") return true;
  if (order.user_id === profile.id) return true;

  if (profile.role === "partner") {
    const taskResult = await supabase.from("tasks").select("assigned_to").eq("order_id", orderId).maybeSingle();
    if (!taskResult.error && taskResult.data) {
      const assignedTo = taskResult.data.assigned_to;
      return !assignedTo || assignedTo === profile.id;
    }
  }

  return false;
};

const getOrderByIdWithItems = async (orderId) => {
  const order = unwrap(
    await supabase.from("orders").select("*").eq("id", orderId).single(),
    "Order not found"
  );

  const items = unwrap(
    await supabase.from("order_items").select("*").eq("order_id", orderId),
    "Unable to load order items"
  ).map(mapOrderItem);

  return mapOrder(order, items);
};

const readConfigParams = (config = {}) => config?.params || {};

const request = async (method, url, payload = {}, config = {}) => {
  throwIfSupabaseUnavailable();

  if (method === "get" && url === "/orders/catalog") {
    return asResponse(instamartDataset);
  }

  if (method === "get" && url === "/books") {
    const books = unwrap(await supabase.from("books").select("id,title,author"), "Unable to fetch books");
    return asResponse(books);
  }

  if (method === "post" && url === "/books/return-pickup") {
    const title = String(payload.title || "Book");
    const slot = String(payload.slot || "Tomorrow 10 AM");
    return asResponse({ message: `${title} return pickup scheduled for ${slot}` });
  }

  if (method === "post" && url === "/books/request") {
    const profile = await getMyProfile();
    const days = Math.max(1, Number(payload.borrowDays || 7));
    const returnDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB");
    const location = payload.location || {};

    const order = unwrap(
      await supabase
        .from("orders")
        .insert({
          user_id: profile.id,
          pre_order_slot: payload.slot || "Today 5 PM",
          status: "Preparing",
          payment_method: "UPI",
          payment_status: "Requested",
          delivery_type: "Instant",
          location_lat: Number(location.lat || HUB_LOCATION.lat),
          location_lng: Number(location.lng || HUB_LOCATION.lng),
          location_address: location.address || "Campus",
          eta_minutes: 20
        })
        .select("*")
        .single(),
      "Unable to request library delivery"
    );

    await unwrap(
      await supabase.from("order_items").insert({
        order_id: order.id,
        name: payload.title,
        category: "Library",
        price: 0,
        quantity: 1,
        borrow_days: days,
        return_date: returnDate
      }),
      "Unable to add library item"
    );

    await createTaskFromOrder(order, profile.id);

    return asResponse({
      message: "Library delivery requested",
      returnDate,
      borrowDays: days,
      order: await getOrderByIdWithItems(order.id)
    });
  }

  if (method === "get" && url === "/dashboard/me") {
    const profile = await getMyProfile();

    const recycling = unwrap(
      await supabase
        .from("recycling_requests")
        .select("weight,carbon_saved")
        .eq("user_id", profile.id),
      "Unable to load recycling stats"
    );

    const totalRecycled = recycling.reduce((sum, row) => sum + Number(row.weight || 0), 0);
    const carbonSaved = recycling.reduce((sum, row) => sum + Number(row.carbon_saved || 0), 0);
    const ecoScore = Math.min(100, Math.round(totalRecycled * 2 + carbonSaved + profile.points / 5));

    return asResponse({
      points: profile.points,
      totalRecycled,
      carbonSaved: Number(carbonSaved.toFixed(2)),
      ecoScore
    });
  }

  if (method === "get" && url === "/dashboard/wallet") {
    const profile = await getMyProfile();
    const wallet = unwrap(
      await supabase
        .from("wallet_transactions")
        .select("type,points,note,created_at")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false }),
      "Unable to load wallet"
    );

    return asResponse({
      points: profile.points,
      transactions: wallet.map((entry) => ({
        type: entry.type,
        points: Number(entry.points || 0),
        note: entry.note,
        createdAt: entry.created_at
      }))
    });
  }

  if (method === "post" && url === "/dashboard/redeem") {
    const points = Number(payload.points || 0);
    if (points <= 0) throw makeError("Points must be positive", 400);

    const redeemed = unwrap(
      await supabase.rpc("redeem_points", { points_to_redeem: points }),
      "Unable to redeem points"
    );

    const record = Array.isArray(redeemed) ? redeemed[0] : redeemed;
    return asResponse({
      message: "Points redeemed",
      pointsLeft: Number(record.points_left || 0),
      discount: Number(record.discount || 0)
    });
  }

  if (method === "post" && url === "/orders") {
    const profile = await getMyProfile();
    const items = Array.isArray(payload.items) ? payload.items : [];

    if (!items.length) throw makeError("Cart is empty", 400);

    const invalidItem = items.some(
      (item) => !item || !item.name || Number(item.quantity) < 1 || Number(item.price) < 0
    );
    if (invalidItem) throw makeError("Invalid order items", 400);

    const location = payload.location || {};
    if (typeof location.lat !== "number" || typeof location.lng !== "number") {
      throw makeError("Valid delivery location is required", 400);
    }

    const activeOrdersResult = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .neq("status", "Delivered");
    if (activeOrdersResult.error) {
      throw makeError(activeOrdersResult.error.message || "Unable to count active orders", 400);
    }
    const activeOrders = Number(activeOrdersResult.count || 0);
    const distanceKm = haversineDistanceKm(HUB_LOCATION, location);
    const etaMinutes = predictEta({ distanceKm, activeOrders });

    const order = unwrap(
      await supabase
        .from("orders")
        .insert({
          user_id: profile.id,
          priority: Boolean(payload.priority),
          delivery_type: payload.deliveryType || "Instant",
          scheduled_date: payload.scheduledDate || "",
          scheduled_time: payload.scheduledTime || "",
          pre_order_slot: payload.preOrderSlot || "ASAP",
          payment_method: payload.paymentMethod || "UPI",
          payment_status: "Requested",
          location_lat: Number(location.lat),
          location_lng: Number(location.lng),
          location_address: location.address || "Campus Zone",
          location_block: location.block || "Main Block",
          location_room: location.room || "",
          eta_minutes: etaMinutes
        })
        .select("*")
        .single(),
      "Unable to create order"
    );

    await unwrap(
      await supabase.from("order_items").insert(
        items.map((item) => ({
          order_id: order.id,
          name: item.name,
          category: item.category || "Grocery",
          price: Number(item.price || 0),
          quantity: Number(item.quantity || 1),
          borrow_days: Number(item.borrowDays || 0),
          return_date: item.returnDate || ""
        }))
      ),
      "Unable to add order items"
    );

    const earnedPoints = payload.priority ? 15 : 10;
    await unwrap(
      await supabase
        .from("profiles")
        .update({ points: profile.points + earnedPoints })
        .eq("id", profile.id),
      "Unable to update points"
    );

    await unwrap(
      await supabase.from("wallet_transactions").insert({
        user_id: profile.id,
        type: "earn",
        points: earnedPoints,
        note: `Order reward (${payload.priority ? "priority" : "standard"})`
      }),
      "Unable to write wallet transaction"
    );

    await createTaskFromOrder(order, profile.id);
    return asResponse(await getOrderByIdWithItems(order.id));
  }

  if (method === "get" && url === "/orders/mine") {
    await getMyProfile();
    const orderRows = unwrap(
      await supabase.from("orders").select("*").order("created_at", { ascending: false }),
      "Unable to fetch orders"
    );

    const itemMap = await loadOrderItemsByOrderIds(orderRows.map((entry) => entry.id));
    return asResponse(orderRows.map((entry) => mapOrder(entry, itemMap.get(entry.id) || [])));
  }

  const orderByIdMatch = url.match(/^\/orders\/([^/]+)$/);
  if (method === "get" && orderByIdMatch) {
    return asResponse(await getOrderByIdWithItems(orderByIdMatch[1]));
  }

  const paymentConfirmMatch = url.match(/^\/orders\/([^/]+)\/payment-confirm$/);
  if (method === "patch" && paymentConfirmMatch) {
    const id = paymentConfirmMatch[1];
    const order = unwrap(
      await supabase
        .from("orders")
        .update({ payment_status: "Paid" })
        .eq("id", id)
        .select("*")
        .single(),
      "Order not found"
    );
    return asResponse(mapOrder(order, unwrap(await supabase.from("order_items").select("*").eq("order_id", id)).map(mapOrderItem)));
  }

  const simulateMatch = url.match(/^\/orders\/([^/]+)\/simulate-progress$/);
  if (method === "patch" && simulateMatch) {
    const id = simulateMatch[1];
    const existing = unwrap(
      await supabase.from("orders").select("*").eq("id", id).single(),
      "Order not found"
    );

    if (existing.payment_status !== "Paid") {
      throw makeError("Payment pending", 400);
    }

    let nextStatus = existing.status;
    if (existing.status === "Preparing") nextStatus = "Out for delivery";
    else if (existing.status === "Out for delivery") nextStatus = "Delivered";

    const updated = unwrap(
      await supabase.from("orders").update({ status: nextStatus }).eq("id", id).select("*").single(),
      "Unable to update order"
    );

    const items = unwrap(await supabase.from("order_items").select("*").eq("order_id", id)).map(mapOrderItem);
    return asResponse(mapOrder(updated, items));
  }

  const orderChatMatch = url.match(/^\/orders\/([^/]+)\/chat$/);
  if (orderChatMatch && method === "get") {
    const id = orderChatMatch[1];
    const profile = await getMyProfile();
    const allowed = await canAccessOrderChat(id, profile);
    if (!allowed) throw makeError("Forbidden", 403);

    const messages = unwrap(
      await supabase
        .from("order_chat_messages")
        .select("id,order_id,sender_id,sender_role,text,created_at,profiles:sender_id(id,name,role,email)")
        .eq("order_id", id)
        .order("created_at", { ascending: true }),
      "Unable to load chat"
    );

    const order = unwrap(await supabase.from("orders").select("id,status").eq("id", id).single(), "Order not found");
    return asResponse({
      orderId: order.id,
      status: order.status,
      messages: messages.map(mapChatMessage)
    });
  }

  if (orderChatMatch && method === "post") {
    const id = orderChatMatch[1];
    const profile = await getMyProfile();
    const allowed = await canAccessOrderChat(id, profile);
    if (!allowed) throw makeError("Forbidden", 403);

    const text = String(payload.text || "").trim();
    if (!text) throw makeError("Message text is required", 400);

    const senderRole = profile.role === "admin" ? "admin" : profile.role === "partner" ? "partner" : "user";
    await unwrap(
      await supabase.from("order_chat_messages").insert({
        order_id: id,
        sender_id: profile.id,
        sender_role: senderRole,
        text
      }),
      "Unable to send message"
    );

    const messages = unwrap(
      await supabase
        .from("order_chat_messages")
        .select("id,order_id,sender_id,sender_role,text,created_at,profiles:sender_id(id,name,role,email)")
        .eq("order_id", id)
        .order("created_at", { ascending: true }),
      "Unable to load messages"
    );

    return asResponse({ orderId: id, messages: messages.map(mapChatMessage) });
  }

  if (method === "post" && url === "/recycling") {
    const profile = await getMyProfile();
    const material = payload.material;
    if (!["plastic", "paper", "metal"].includes(material)) throw makeError("Invalid material type", 400);

    const quantity = Math.max(1, Number(payload.quantity || 1));
    const sizeType = payload.sizeType || "";
    const location = payload.location || {};
    if (typeof location.lat !== "number" || typeof location.lng !== "number") {
      throw makeError("Pickup location is required", 400);
    }

    const weight = Number(payload.weight || estimateWeight(material, sizeType, quantity));
    const carbonSaved = calculateCarbonSaved(material, weight);
    const sizePoints = sizePointsMap[material]?.[sizeType] || 0;
    const earnedPoints = sizePoints
      ? Math.round(sizePoints * quantity)
      : Math.round((pointsPerKg[material] || 0) * weight);

    const reqRow = unwrap(
      await supabase
        .from("recycling_requests")
        .insert({
          user_id: profile.id,
          material,
          item_type: payload.itemType || material,
          quantity,
          size_type: sizeType,
          weight,
          carbon_saved: carbonSaved,
          status: "Requested",
          scheduled_at: payload.scheduledAt || "Today",
          location_lat: Number(location.lat),
          location_lng: Number(location.lng),
          location_address: location.address || "Campus Recycling Point"
        })
        .select("*")
        .single(),
      "Unable to create recycling request"
    );

    await unwrap(
      await supabase.from("profiles").update({ points: profile.points + earnedPoints }).eq("id", profile.id),
      "Unable to update wallet points"
    );

    await unwrap(
      await supabase.from("wallet_transactions").insert({
        user_id: profile.id,
        type: "earn",
        points: earnedPoints,
        note: `Recycling ${payload.itemType || material} (${quantity} x ${sizeType || material})`
      }),
      "Unable to save wallet transaction"
    );

    await createTaskFromRecycling(reqRow, profile.id);
    return asResponse({ ...mapRecycling(reqRow), earnedPoints });
  }

  if (method === "get" && url === "/tasks/partner") {
    const profile = await getMyProfile();
    requireRole(profile, "partner", "admin");

    const taskRows = unwrap(
      await supabase.from("tasks").select("*").neq("status", "Completed").order("created_at", { ascending: false }),
      "Unable to load tasks"
    );

    const orderIds = taskRows.map((entry) => entry.order_id).filter(Boolean);
    const recyclingIds = taskRows.map((entry) => entry.recycling_id).filter(Boolean);
    const assigneeIds = taskRows.map((entry) => entry.assigned_to).filter(Boolean);

    const orders = orderIds.length
      ? unwrap(await supabase.from("orders").select("*").in("id", orderIds), "Unable to load tasks orders")
      : [];
    const orderItemMap = await loadOrderItemsByOrderIds(orderIds);

    const recycling = recyclingIds.length
      ? unwrap(await supabase.from("recycling_requests").select("*").in("id", recyclingIds), "Unable to load tasks recycling")
      : [];

    const assignees = await loadProfilesByIds(assigneeIds);
    const orderMap = new Map(orders.map((entry) => [entry.id, mapOrder(entry, orderItemMap.get(entry.id) || [])]));
    const recyclingMap = new Map(recycling.map((entry) => [entry.id, mapRecycling(entry)]));

    return asResponse(
      taskRows.map((entry) =>
        mapTask(
          entry,
          entry.order_id ? orderMap.get(entry.order_id) : null,
          entry.recycling_id ? recyclingMap.get(entry.recycling_id) : null,
          entry.assigned_to ? assignees.get(entry.assigned_to) : null
        )
      )
    );
  }

  const taskByOrderMatch = url.match(/^\/tasks\/by-order\/([^/]+)$/);
  if (method === "get" && taskByOrderMatch) {
    const orderId = taskByOrderMatch[1];

    const taskRow = await supabase.from("tasks").select("*").eq("order_id", orderId).maybeSingle();
    if (taskRow.error) throw makeError(taskRow.error.message, 400);
    if (!taskRow.data) return asResponse({ hasTask: false, ecoOptimized: false });

    const row = taskRow.data;
    const recycling = row.recycling_id
      ? mapRecycling(unwrap(await supabase.from("recycling_requests").select("*").eq("id", row.recycling_id).single(), "Unable to load recycling"))
      : null;
    const assignee = row.assigned_to
      ? unwrap(await supabase.from("profiles").select("id,name,email").eq("id", row.assigned_to).single(), "Unable to load assignee")
      : null;

    return asResponse({
      hasTask: true,
      ecoOptimized: Boolean(row.order_id && row.recycling_id),
      task: mapTask(row, null, recycling, assignee)
    });
  }

  const taskAcceptMatch = url.match(/^\/tasks\/([^/]+)\/accept$/);
  if (method === "post" && taskAcceptMatch) {
    const profile = await getMyProfile();
    requireRole(profile, "partner", "admin");

    const updated = unwrap(
      await supabase
        .from("tasks")
        .update({ assigned_to: profile.id, status: "Accepted" })
        .eq("id", taskAcceptMatch[1])
        .select("*")
        .single(),
      "Task not found"
    );

    return asResponse(mapTask(updated));
  }

  const taskStatusMatch = url.match(/^\/tasks\/([^/]+)\/status$/);
  if (method === "patch" && taskStatusMatch) {
    const profile = await getMyProfile();
    requireRole(profile, "partner", "admin");

    const status = payload.status;
    const updated = unwrap(
      await supabase.from("tasks").update({ status }).eq("id", taskStatusMatch[1]).select("*").single(),
      "Task not found"
    );

    if (status === "Completed") {
      if (updated.order_id) {
        await unwrap(
          await supabase.from("orders").update({ status: "Delivered" }).eq("id", updated.order_id),
          "Unable to complete order"
        );
      }
      if (updated.recycling_id) {
        await unwrap(
          await supabase.from("recycling_requests").update({ status: "Processed" }).eq("id", updated.recycling_id),
          "Unable to complete recycling"
        );
      }
    }

    return asResponse(mapTask(updated));
  }

  if (method === "get" && url === "/admin/orders") {
    const profile = await getMyProfile();
    requireRole(profile, "admin");

    const orderRows = unwrap(
      await supabase.from("orders").select("*").order("created_at", { ascending: false }),
      "Unable to load orders"
    );
    const itemMap = await loadOrderItemsByOrderIds(orderRows.map((entry) => entry.id));
    const userMap = await loadProfilesByIds(orderRows.map((entry) => entry.user_id));

    return asResponse(
      orderRows.map((entry) =>
        mapOrder(entry, itemMap.get(entry.id) || [], userMap.get(entry.user_id))
      )
    );
  }

  if (method === "get" && url === "/admin/analytics") {
    const profile = await getMyProfile();
    requireRole(profile, "admin");

    const orders = unwrap(await supabase.from("orders").select("id"), "Unable to load orders");
    const orderItems = unwrap(await supabase.from("order_items").select("price,quantity"), "Unable to load items");
    const recycling = unwrap(
      await supabase.from("recycling_requests").select("weight,carbon_saved"),
      "Unable to load recycling"
    );

    const totalRevenue = orderItems.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0
    );

    const totalWeight = recycling.reduce((sum, entry) => sum + Number(entry.weight || 0), 0);
    const carbonSaved = recycling.reduce((sum, entry) => sum + Number(entry.carbon_saved || 0), 0);

    return asResponse({
      totalOrders: orders.length,
      totalRevenue,
      recycling: {
        totalRequests: recycling.length,
        totalWeight,
        carbonSaved
      }
    });
  }

  const adminPriorityMatch = url.match(/^\/admin\/orders\/([^/]+)\/priority$/);
  if (method === "patch" && adminPriorityMatch) {
    const profile = await getMyProfile();
    requireRole(profile, "admin");

    const updated = unwrap(
      await supabase.from("orders").update({ priority: true }).eq("id", adminPriorityMatch[1]).select("*").single(),
      "Order not found"
    );

    const items = unwrap(await supabase.from("order_items").select("*").eq("order_id", updated.id)).map(mapOrderItem);
    return asResponse(mapOrder(updated, items));
  }

  if (method === "patch" && url === "/auth/me") {
    const profile = await getMyProfile();
    const updates = {};
    if (typeof payload.name === "string") updates.name = payload.name;
    if (typeof payload.phone === "string") updates.phone = payload.phone;
    if (typeof payload.language === "string") updates.language = payload.language;
    if (payload.preferences && typeof payload.preferences === "object") {
      updates.preferences = {
        ...(profile.preferences || {}),
        ...payload.preferences
      };
    }

    const updated = unwrap(
      await supabase.from("profiles").update(updates).eq("id", profile.id).select("*").single(),
      "Unable to update profile"
    );
    return asResponse(mapProfile(updated));
  }

  if (method === "get" && url === "/rent/requests") {
    const profile = await getMyProfile();

    const requests = unwrap(
      await supabase
        .from("rental_requests")
        .select("*")
        .or(`lender_id.eq.${profile.id},renter_id.eq.${profile.id}`)
        .order("created_at", { ascending: false }),
      "Unable to load requests"
    );

    const itemIds = [...new Set(requests.map((entry) => entry.rent_item_id))];
    const userIds = [...new Set(requests.flatMap((entry) => [entry.lender_id, entry.renter_id]))];
    const reqIds = requests.map((entry) => entry.id);

    const itemRows = itemIds.length
      ? unwrap(await supabase.from("rent_items").select("*").in("id", itemIds), "Unable to load rent items")
      : [];
    const usersMap = await loadProfilesByIds(userIds);

    const msgRows = reqIds.length
      ? unwrap(
          await supabase
            .from("rental_messages")
            .select("id,rental_request_id,sender_id,sender_role,text,offered_price_per_day,created_at,profiles:sender_id(id,name,email)")
            .in("rental_request_id", reqIds)
            .order("created_at", { ascending: true }),
          "Unable to load rental messages"
        )
      : [];

    const ownerIds = itemRows.map((entry) => entry.owner_id);
    const ownersMap = await loadProfilesByIds(ownerIds);
    const itemMap = new Map(itemRows.map((entry) => [entry.id, mapRentItem(entry, ownersMap.get(entry.owner_id))]));

    const msgMap = new Map();
    msgRows.forEach((entry) => {
      if (!msgMap.has(entry.rental_request_id)) msgMap.set(entry.rental_request_id, []);
      msgMap.get(entry.rental_request_id).push(mapRentalMessage(entry));
    });

    return asResponse(
      requests.map((entry) =>
        mapRentalRequest(
          entry,
          itemMap.get(entry.rent_item_id) || null,
          usersMap.get(entry.lender_id) || null,
          usersMap.get(entry.renter_id) || null,
          msgMap.get(entry.id) || []
        )
      )
    );
  }

  if (method === "get" && url === "/rent/items") {
    await getMyProfile();
    const params = readConfigParams(config);
    const showUnavailable = params.showUnavailable === true || params.showUnavailable === "true";

    let query = supabase.from("rent_items").select("*").order("created_at", { ascending: false });
    if (!showUnavailable) {
      query = query.eq("availability", true);
    }

    const rows = unwrap(await query, "Unable to load rent items");
    const ownerMap = await loadProfilesByIds([...new Set(rows.map((entry) => entry.owner_id))]);

    return asResponse(rows.map((entry) => mapRentItem(entry, ownerMap.get(entry.owner_id))));
  }

  if (method === "post" && url === "/rent/items") {
    const profile = await getMyProfile();

    if (!payload.name || typeof payload.name !== "string") throw makeError("Item name is required", 400);
    const parsedPrice = Number(payload.pricePerDay);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      throw makeError("Price per day must be positive", 400);
    }

    const item = unwrap(
      await supabase
        .from("rent_items")
        .insert({
          owner_id: profile.id,
          name: payload.name.trim(),
          description: payload.description || "",
          category: payload.category || "Other",
          condition: payload.condition || "Good",
          location: payload.location || "Campus",
          price_per_day: parsedPrice,
          images: payload.images || [],
          availability: payload.availability !== false
        })
        .select("*")
        .single(),
      "Unable to create rent item"
    );

    return asResponse(mapRentItem(item, { id: profile.id, name: profile.name, email: profile.email }));
  }

  const rentItemPatchMatch = url.match(/^\/rent\/items\/([^/]+)$/);
  if (method === "patch" && rentItemPatchMatch) {
    const profile = await getMyProfile();
    const existing = unwrap(
      await supabase.from("rent_items").select("*").eq("id", rentItemPatchMatch[1]).single(),
      "Rent item not found"
    );

    if (existing.owner_id !== profile.id) throw makeError("Only owner can update item", 403);

    const updates = {};
    ["availability", "description", "location", "condition", "category"].forEach((field) => {
      if (payload[field] !== undefined) {
        const key = field.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
        updates[key] = payload[field];
      }
    });

    if (payload.pricePerDay !== undefined) {
      const parsedPrice = Number(payload.pricePerDay);
      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        throw makeError("Price per day must be positive", 400);
      }
      updates.price_per_day = parsedPrice;
    }

    const updated = unwrap(
      await supabase.from("rent_items").update(updates).eq("id", existing.id).select("*").single(),
      "Unable to update item"
    );
    return asResponse(mapRentItem(updated, { id: profile.id, name: profile.name, email: profile.email }));
  }

  if (method === "delete" && rentItemPatchMatch) {
    const profile = await getMyProfile();
    const existing = unwrap(
      await supabase.from("rent_items").select("*").eq("id", rentItemPatchMatch[1]).single(),
      "Rent item not found"
    );

    if (existing.owner_id !== profile.id) throw makeError("Only owner can delete item", 403);

    await unwrap(
      await supabase
        .from("rental_requests")
        .delete()
        .eq("rent_item_id", existing.id)
        .eq("status", "Requested"),
      "Unable to clear pending requests"
    );

    await unwrap(await supabase.from("rent_items").delete().eq("id", existing.id), "Unable to remove item");
    return asResponse({ message: "Rent item deleted" });
  }

  if (method === "post" && url === "/rent/request") {
    const profile = await getMyProfile();
    const item = unwrap(
      await supabase.from("rent_items").select("*").eq("id", payload.rentItemId).single(),
      "Rent item unavailable"
    );

    if (!item.availability) throw makeError("Rent item unavailable", 404);
    if (item.owner_id === profile.id) throw makeError("You cannot rent your own listed item", 400);

    const duration = Number(payload.durationDays);
    if (!Number.isFinite(duration) || duration <= 0) {
      throw makeError("Duration must be at least 1 day", 400);
    }

    const existing = await supabase
      .from("rental_requests")
      .select("id")
      .eq("rent_item_id", item.id)
      .eq("renter_id", profile.id)
      .eq("status", "Requested")
      .maybeSingle();

    if (existing.data) throw makeError("You already requested this item", 400);

    const totalCost = Number(item.price_per_day) * duration;
    const requestRow = unwrap(
      await supabase
        .from("rental_requests")
        .insert({
          rent_item_id: item.id,
          lender_id: item.owner_id,
          renter_id: profile.id,
          duration_days: duration,
          negotiated_price_per_day: Number(item.price_per_day),
          total_cost: totalCost,
          contact: payload.contact || ""
        })
        .select("*")
        .single(),
      "Unable to create rental request"
    );

    await unwrap(
      await supabase.from("rental_messages").insert({
        rental_request_id: requestRow.id,
        sender_id: profile.id,
        sender_role: "renter",
        text: payload.contact || "Rental request created",
        offered_price_per_day: Number(item.price_per_day)
      }),
      "Unable to initialize rental chat"
    );

    return asResponse(mapRentalRequest(requestRow));
  }

  const rentalApproveMatch = url.match(/^\/rent\/requests\/([^/]+)\/(approve|reject|cancel)$/);
  if (method === "patch" && rentalApproveMatch) {
    const profile = await getMyProfile();
    const id = rentalApproveMatch[1];
    const action = rentalApproveMatch[2];
    const requestRow = unwrap(
      await supabase.from("rental_requests").select("*").eq("id", id).single(),
      "Request not found"
    );

    if (action === "approve" || action === "reject") {
      if (requestRow.lender_id !== profile.id) throw makeError(`Only lender can ${action}`, 403);
      const nextStatus = action === "approve" ? "Approved" : "Rejected";
      const updated = unwrap(
        await supabase.from("rental_requests").update({ status: nextStatus }).eq("id", id).select("*").single(),
        "Unable to update request"
      );
      return asResponse(mapRentalRequest(updated));
    }

    if (requestRow.renter_id !== profile.id) throw makeError("Only renter can cancel", 403);
    if (requestRow.status !== "Requested") throw makeError("Only requested rentals can be cancelled", 400);

    const updated = unwrap(
      await supabase.from("rental_requests").update({ status: "Rejected" }).eq("id", id).select("*").single(),
      "Unable to cancel request"
    );
    return asResponse(mapRentalRequest(updated));
  }

  const rentalMessagesMatch = url.match(/^\/rent\/requests\/([^/]+)\/messages$/);
  if (rentalMessagesMatch && method === "get") {
    const profile = await getMyProfile();
    const requestRow = unwrap(
      await supabase.from("rental_requests").select("*").eq("id", rentalMessagesMatch[1]).single(),
      "Request not found"
    );

    if (![requestRow.lender_id, requestRow.renter_id].includes(profile.id) && profile.role !== "admin") {
      throw makeError("Only request participants can view chat", 403);
    }

    const messages = unwrap(
      await supabase
        .from("rental_messages")
        .select("id,rental_request_id,sender_id,sender_role,text,offered_price_per_day,created_at,profiles:sender_id(id,name,email)")
        .eq("rental_request_id", requestRow.id)
        .order("created_at", { ascending: true }),
      "Unable to load messages"
    );

    return asResponse({
      requestId: requestRow.id,
      negotiatedPricePerDay: Number(requestRow.negotiated_price_per_day || 0),
      totalCost: Number(requestRow.total_cost || 0),
      messages: messages.map(mapRentalMessage)
    });
  }

  if (rentalMessagesMatch && method === "post") {
    const profile = await getMyProfile();
    const requestRow = unwrap(
      await supabase.from("rental_requests").select("*").eq("id", rentalMessagesMatch[1]).single(),
      "Request not found"
    );

    if (![requestRow.lender_id, requestRow.renter_id].includes(profile.id) && profile.role !== "admin") {
      throw makeError("Only request participants can message", 403);
    }

    const text = String(payload.text || "").trim();
    const offer = Number(payload.offeredPricePerDay || 0);

    if (!text && (!Number.isFinite(offer) || offer <= 0)) {
      throw makeError("Message text or valid offered price is required", 400);
    }

    const senderRole = requestRow.lender_id === profile.id ? "lender" : "renter";

    await unwrap(
      await supabase.from("rental_messages").insert({
        rental_request_id: requestRow.id,
        sender_id: profile.id,
        sender_role: senderRole,
        text,
        offered_price_per_day: Number.isFinite(offer) && offer > 0 ? offer : 0
      }),
      "Unable to send message"
    );

    let negotiated = Number(requestRow.negotiated_price_per_day || 0);
    let total = Number(requestRow.total_cost || 0);

    if (Number.isFinite(offer) && offer > 0) {
      negotiated = offer;
      total = offer * Number(requestRow.duration_days || 1);
      await unwrap(
        await supabase
          .from("rental_requests")
          .update({ negotiated_price_per_day: negotiated, total_cost: total })
          .eq("id", requestRow.id),
        "Unable to update negotiated price"
      );
    }

    const messages = unwrap(
      await supabase
        .from("rental_messages")
        .select("id,rental_request_id,sender_id,sender_role,text,offered_price_per_day,created_at,profiles:sender_id(id,name,email)")
        .eq("rental_request_id", requestRow.id)
        .order("created_at", { ascending: true }),
      "Unable to load messages"
    );

    return asResponse({
      requestId: requestRow.id,
      negotiatedPricePerDay: negotiated,
      totalCost: total,
      messages: messages.map(mapRentalMessage)
    });
  }

  throw makeError(`Route not found: ${method.toUpperCase()} ${url}`, 404);
};

const api = {
  get: (url, config) => request("get", url, null, config),
  post: (url, payload, config) => request("post", url, payload || {}, config),
  patch: (url, payload, config) => request("patch", url, payload || {}, config),
  delete: (url, config) => request("delete", url, null, config)
};

export default api;
