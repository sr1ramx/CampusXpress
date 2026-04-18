const baseUrl = "http://localhost:5000/api";

const request = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    method: options.method || "GET",
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    data = { raw: text };
  }

  return { ok: response.ok, status: response.status, data };
};

const assert = (condition, label, details = "") => {
  if (!condition) {
    throw new Error(`FAIL: ${label}${details ? ` | ${details}` : ""}`);
  }
  console.log(`PASS: ${label}`);
};

const run = async () => {
  const stamp = Date.now();
  const users = {
    user: {
      name: "Smoke User",
      email: `smoke.user.${stamp}@cx.dev`,
      password: "Password123!",
      role: "user"
    },
    partner: {
      name: "Smoke Partner",
      email: `smoke.partner.${stamp}@cx.dev`,
      password: "Password123!",
      role: "partner"
    },
    admin: {
      name: "Smoke Admin",
      email: `smoke.admin.${stamp}@cx.dev`,
      password: "Password123!",
      role: "admin"
    }
  };

  const signupUser = await request("/auth/signup", { method: "POST", body: users.user });
  const signupPartner = await request("/auth/signup", { method: "POST", body: users.partner });
  const signupAdmin = await request("/auth/signup", { method: "POST", body: users.admin });

  assert(signupUser.ok, "User signup");
  assert(signupPartner.ok, "Partner signup");
  assert(signupAdmin.ok, "Admin signup");

  const userToken = signupUser.data.token;
  const partnerToken = signupPartner.data.token;
  const adminToken = signupAdmin.data.token;

  const health = await request("/health");
  assert(health.ok && health.data.status === "ok", "Health endpoint");

  const catalog = await request("/orders/catalog");
  assert(catalog.ok, "Catalog endpoint");
  assert((catalog.data.Food || []).length >= 50, "Food dataset >= 50");
  assert((catalog.data.Grocery || []).length >= 50, "Grocery dataset >= 50");
  assert((catalog.data.Stationery || []).length >= 50, "Stationery dataset >= 50");
  assert((catalog.data.Library || []).length >= 50, "Library dataset >= 50");

  const loc = { lat: 12.9716, lng: 77.5946, address: "North Gate", block: "North Gate", room: "A-101" };

  const recycle = await request("/recycling", {
    method: "POST",
    token: userToken,
    body: { material: "plastic", weight: 2, scheduledAt: "Today", location: loc }
  });
  assert(recycle.ok, "Recycle request create");
  assert(recycle.data.earnedPoints === 12, "Recycle points formula (plastic 2kg => 12)");

  const order = await request("/orders", {
    method: "POST",
    token: userToken,
    body: {
      items: [
        { name: "Paneer Kathi Roll", category: "Food", price: 120, quantity: 2 },
        { name: "Notebook", category: "Stationery", price: 40, quantity: 1 }
      ],
      priority: true,
      preOrderSlot: "ASAP",
      paymentMethod: "UPI",
      location: loc
    }
  });
  assert(order.ok, "Order create");
  assert(typeof order.data.etaMinutes === "number" && order.data.etaMinutes > 0, "ETA prediction present");

  const payment = await request(`/orders/${order.data._id}/payment-confirm`, {
    method: "PATCH",
    token: userToken
  });
  assert(payment.ok && payment.data.paymentStatus === "Paid", "Payment confirmation");

  const progress1 = await request(`/orders/${order.data._id}/simulate-progress`, {
    method: "PATCH",
    token: userToken
  });
  const progress2 = await request(`/orders/${order.data._id}/simulate-progress`, {
    method: "PATCH",
    token: userToken
  });
  assert(progress1.ok && progress2.ok, "Tracking progress simulation");

  const tracking = await request(`/orders/${order.data._id}/tracking`, { token: userToken });
  assert(tracking.ok, "Tracking endpoint");

  const taskByOrder = await request(`/tasks/by-order/${order.data._id}`, { token: userToken });
  assert(taskByOrder.ok, "Task by order endpoint");
  assert(taskByOrder.data.ecoOptimized === true, "Eco-optimized combined task");

  const wallet = await request("/dashboard/wallet", { token: userToken });
  assert(wallet.ok, "Wallet endpoint");
  assert((wallet.data.transactions || []).length > 0, "Wallet transactions exist");

  const ordersMine = await request("/orders/mine", { token: userToken });
  assert(ordersMine.ok && ordersMine.data.length > 0, "My orders endpoint");

  const books = await request("/books");
  assert(books.ok && Array.isArray(books.data), "Books endpoint");

  const partnerTasks = await request("/tasks/partner", { token: partnerToken });
  assert(partnerTasks.ok && partnerTasks.data.length > 0, "Partner tasks list");

  const firstTaskId = partnerTasks.data[0]._id;
  const acceptTask = await request(`/tasks/${firstTaskId}/accept`, { method: "POST", token: partnerToken });
  assert(acceptTask.ok, "Partner accept task");

  const taskTransit = await request(`/tasks/${firstTaskId}/status`, {
    method: "PATCH",
    token: partnerToken,
    body: { status: "In Transit" }
  });
  assert(taskTransit.ok, "Partner status In Transit");

  const adminAnalytics = await request("/admin/analytics", { token: adminToken });
  assert(adminAnalytics.ok, "Admin analytics");
  assert(typeof adminAnalytics.data.totalRevenue === "number", "Admin revenue metric");

  const adminUsers = await request("/admin/users", { token: adminToken });
  assert(adminUsers.ok && adminUsers.data.length >= 3, "Admin users list");

  const adminOrders = await request("/admin/orders", { token: adminToken });
  assert(adminOrders.ok && adminOrders.data.length > 0, "Admin orders list");

  console.log("\nALL TESTS PASSED");
};

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
