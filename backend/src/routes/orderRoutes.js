const express = require("express");
const Order = require("../models/Order");
const User = require("../models/User");
const Task = require("../models/Task");
const { protect } = require("../middleware/auth");
const { validateCreateOrder } = require("../middleware/validators");
const { haversineDistanceKm } = require("../utils/routeOptimizer");
const { predictEta } = require("../utils/etaPredictor");
const { createTaskFromOrder } = require("../utils/taskEngine");

const router = express.Router();

const categoryDefaultImages = {
  food: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=1000&q=80",
  grocery: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=80",
  stationery: "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&w=1000&q=80",
  library: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1000&q=80"
};

const keywordImageRules = [
  {
    terms: ["burger", "sandwich", "wrap", "roll", "pizza", "fries", "momos", "bhature", "patty", "puff"],
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1000&q=80"
  },
  {
    terms: ["dosa", "idli", "paratha", "poha", "upma", "maggi"],
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=1000&q=80"
  },
  {
    terms: ["rice", "pulao", "khichdi", "bowl"],
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db9c?auto=format&fit=crop&w=1000&q=80"
  },
  {
    terms: ["coffee", "tea", "lassi", "shake", "juice", "soda", "brew"],
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=1000&q=80"
  },
  {
    terms: ["salad", "fruit"],
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1000&q=80"
  },
  {
    terms: ["milk", "curd", "yogurt", "cheese", "butter", "paneer"],
    image: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=1000&q=80"
  },
  {
    terms: ["egg"],
    image: "https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=1000&q=80"
  },
  {
    terms: ["banana", "apple", "orange", "spinach", "cucumber", "carrot", "capsicum", "broccoli", "onion", "potato", "tomato", "peas", "corn"],
    image: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=1000&q=80"
  },
  {
    terms: ["rice", "dal", "oil", "salt", "sugar", "oats", "muesli", "cornflakes"],
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=1000&q=80"
  },
  {
    terms: ["toothpaste", "toothbrush", "shampoo", "detergent", "dishwash", "handwash", "tissue", "garbage"],
    image: "https://images.unsplash.com/photo-1583947582886-f40ec95dd752?auto=format&fit=crop&w=1000&q=80"
  },
  {
    terms: ["notebook", "journal", "planner", "diary", "exam", "sketchbook", "drawing"],
    image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=1000&q=80"
  },
  {
    terms: ["pen", "pencil", "highlighter", "marker", "liner", "calligraphy", "refill"],
    image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=1000&q=80"
  },
  {
    terms: ["geometry", "ruler", "scissors", "stapler", "calculator", "folder", "clipboard", "organizer", "binder", "tape"],
    image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1000&q=80"
  },
  {
    terms: ["book", "guide", "handbook", "notes", "manual", "fundamentals", "programming", "mathematics", "physics", "literature", "science", "economics", "law"],
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1000&q=80"
  }
];

const normalizeProductName = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const imageForName = (name, category) => {
  const normalized = normalizeProductName(name);
  for (const rule of keywordImageRules) {
    if (rule.terms.some((term) => normalized.includes(term))) {
      return rule.image;
    }
  }

  const categoryKey = String(category || "grocery").toLowerCase();
  return categoryDefaultImages[categoryKey] || categoryDefaultImages.grocery;
};

const productImages = {};

const generateCategoryItems = (category, names, basePrice, priceStep = 12) =>
  names.map((name, index) => ({
    id: `${category.toLowerCase().slice(0, 3)}-${index + 1}`,
    name,
    price: basePrice + (index % 10) * priceStep,
    category,
    image: getItemImage(category, name, index),
    description: `${name} delivered to your campus block in minutes.`
  }));

const foodNames = [
  "Paneer Kathi Roll", "Veg Momos", "Masala Dosa", "Cheese Sandwich", "Peri Peri Fries",
  "Rice Bowl Combo", "Aloo Paratha", "Idli Sambar", "Cold Coffee", "Fresh Lime Soda",
  "Pasta Alfredo", "Veg Burger", "Chole Bhature", "Chicken Wrap", "Fruit Salad Cup",
  "Chocolate Muffin", "Protein Shake", "Falafel Pocket", "Veg Hakka Noodles", "Margherita Slice",
  "Corn Chaat", "Curd Rice", "Tandoori Paneer Box", "Poha Bowl", "Upma Cup",
  "Veg Cutlet", "Taco Pair", "Smoothie Blend", "Lemon Tea", "Brownie Bite",
  "Samosa Pair", "Kathi Paneer Box", "Mediterranean Bowl", "Mini Pizza", "Veg Pulao",
  "Egg Fried Rice", "Masala Maggi", "Oats Bowl", "Banana Shake", "Pomegranate Juice",
  "Sub Combo", "Methi Thepla", "Pav Bhaji", "Khichdi Bowl", "Mushroom Roll",
  "Caesar Salad", "Nachos Box", "Cold Brew", "Gulab Jamun Cup", "Ragi Dosa",
  "Peanut Chikki", "Lassi Cup", "Soy Wrap", "Veg Patty Puff", "Paneer Tikka Wrap"
];

const groceryNames = [
  "Organic Bananas", "Farm Eggs", "Toned Milk", "Whole Wheat Bread", "Peanut Butter Jar",
  "Instant Oats", "Greek Yogurt", "Cheddar Cheese", "Almond Pack", "Roasted Cashews",
  "Basmati Rice", "Toor Dal", "Moong Dal", "Cooking Oil", "Tomato Ketchup",
  "Pasta Pack", "Cornflakes Box", "Green Tea Bags", "Dark Chocolate", "Mineral Water",
  "Apple Pack", "Orange Pack", "Onion 1kg", "Potato 1kg", "Tomato 1kg",
  "Spinach Bunch", "Cucumber Pack", "Carrot 500g", "Capsicum Pack", "Broccoli",
  "Butter 100g", "Paneer 200g", "Curd Cup", "Protein Bar", "Honey Bottle",
  "Jam Jar", "Mayonnaise", "Tissue Roll", "Dishwash Gel", "Handwash Bottle",
  "Toothpaste", "Toothbrush", "Shampoo Sachet", "Laundry Detergent", "Garbage Bags",
  "Muesli Pack", "Dates Box", "Raisins Pack", "Peas Frozen", "Sweet Corn Frozen",
  "Energy Drink", "Soda Can", "Coffee Powder", "Sugar 1kg", "Salt 1kg"
];

const stationeryNames = [
  "A4 Notebook", "Spiral Notebook", "Sticky Notes", "Gel Pen Blue", "Gel Pen Black",
  "Highlighter Set", "Pencil Pack", "Eraser Combo", "Sharpener", "Ruler 30cm",
  "Geometry Box", "File Folder", "Clip Board", "Marker Pen", "Whiteboard Marker",
  "Correction Pen", "Glue Stick", "Craft Paper", "Chart Paper", "Binder Clips",
  "Stapler", "Staple Pins", "Scissors", "Tape Roll", "Desk Calendar",
  "Exam Pad", "Index Cards", "Page Flags", "Mechanical Pencil", "Refill Leads",
  "Calculator", "Laptop Sleeve", "USB Drive", "Sticky Tabs", "Subject Divider",
  "Drawing Book", "Color Pencil Set", "Sketch Pen Set", "Fine Liner Set", "Envelope Pack",
  "Punch Machine", "Paper Cutter", "Desk Organizer", "Bullet Journal", "Note Planner",
  "Calligraphy Pen", "Clipboard Mini", "Pen Stand", "Diary Book", "Label Stickers",
  "Mini Whiteboard", "Binder Rings", "Sketchbook A5", "Acrylic Paint Set", "Desk Mat"
];

const libraryNames = [
  "Data Structures in C", "Operating Systems Essentials", "Database Systems", "Modern Physics Notes", "Linear Algebra Guide",
  "Discrete Mathematics", "Computer Networks", "Machine Learning Primer", "Artificial Intelligence Basics", "Cyber Security Handbook",
  "Compiler Design", "Software Engineering", "Digital Electronics", "Signals and Systems", "Control Systems",
  "Microprocessors", "Civil Engineering Drawing", "Thermodynamics", "Fluid Mechanics", "Engineering Mechanics",
  "Biochemistry Manual", "Human Anatomy Basics", "Economics for Engineers", "Business Communication", "Project Management",
  "Cloud Computing", "DevOps Fundamentals", "Python Programming", "Java Programming", "Web Development",
  "React in Action", "Node.js Handbook", "MongoDB Complete", "UI UX Principles", "Design Thinking",
  "English Literature Vol 1", "Sociology Intro", "Political Science Today", "History of Science", "Environmental Studies",
  "Robotics Fundamentals", "Data Science Toolkit", "Statistics Essentials", "Research Methodology", "Technical Writing",
  "Campus Placement Guide", "Aptitude Master", "Interview Prep Notes", "Startup Playbook", "Leadership Essentials",
  "Ethics in Tech", "Innovation Management", "Econometrics Intro", "Law for Students", "Public Speaking"
];

[
  ["Food", foodNames],
  ["Grocery", groceryNames],
  ["Stationery", stationeryNames],
  ["Library", libraryNames]
].forEach(([category, names]) => {
  names.forEach((name) => {
    productImages[name] = imageForName(name, category);
  });
});

const getItemImage = (category, name) => {
  return productImages[name] || imageForName(name, category);
};

const catalog = {
  Food: generateCategoryItems("Food", foodNames, 70, 15),
  Grocery: generateCategoryItems("Grocery", groceryNames, 30, 10),
  Stationery: generateCategoryItems("Stationery", stationeryNames, 20, 8),
  Library: generateCategoryItems("Library", libraryNames, 0, 0)
};

router.get("/catalog", (req, res) => {
  res.json(catalog);
});

router.post("/", protect, validateCreateOrder, async (req, res, next) => {
  try {
    const {
      items,
      priority = false,
      deliveryType = "Instant",
      scheduledDate = "",
      scheduledTime = "",
      preOrderSlot = "ASAP",
      paymentMethod = "UPI",
      location
    } = req.body;

    const activeOrders = await Order.countDocuments({ status: { $ne: "Delivered" } });
    const hubLocation = { lat: 12.9716, lng: 77.5946 };
    const distanceKm = haversineDistanceKm(hubLocation, location);
    const etaMinutes = predictEta({ distanceKm, activeOrders });

    const order = await Order.create({
      userId: req.user.id,
      items,
      priority,
      deliveryType,
      scheduledDate,
      scheduledTime,
      preOrderSlot,
      paymentMethod,
      paymentStatus: "Requested",
      location,
      etaMinutes
    });

    await User.findByIdAndUpdate(req.user.id, { $inc: { points: priority ? 15 : 10 } });
    await createTaskFromOrder(order);

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
});

router.patch("/:orderId/payment-confirm", protect, async (req, res) => {
  const order = await Order.findOne({ _id: req.params.orderId, userId: req.user.id });

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  order.paymentStatus = "Paid";
  if (order.status === "Preparing") {
    order.status = "Preparing";
  }
  await order.save();

  return res.json(order);
});

router.patch("/:orderId/simulate-progress", protect, async (req, res) => {
  const order = await Order.findOne({ _id: req.params.orderId, userId: req.user.id });

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (order.paymentStatus !== "Paid") {
    return res.status(400).json({ message: "Payment pending" });
  }

  if (order.status === "Preparing") {
    order.status = "Out for delivery";
  } else if (order.status === "Out for delivery") {
    order.status = "Delivered";
  }

  await order.save();
  return res.json(order);
});

router.get("/mine", protect, async (req, res) => {
  const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(orders);
});

router.get("/:orderId/tracking", protect, async (req, res) => {
  const order = await Order.findOne({ _id: req.params.orderId, userId: req.user.id });
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  const mockPath = [
    { lat: 12.9716, lng: 77.5946, status: "Preparing" },
    { lat: 12.974, lng: 77.6, status: "Out for delivery" },
    { lat: order.location.lat, lng: order.location.lng, status: "Delivered" }
  ];

  return res.json({
    orderId: order._id,
    status: order.status,
    etaMinutes: order.etaMinutes,
    path: mockPath
  });
});

router.get("/:orderId/chat", protect, async (req, res) => {
  const order = await Order.findById(req.params.orderId).populate("chatMessages.senderId", "name role");
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  const isOwner = String(order.userId) === req.user.id;
  const partnerTask = await Task.findOne({ orderId: order._id });
  const isAssignedPartner =
    req.user.role === "partner" &&
    Boolean(partnerTask) &&
    (!partnerTask.assignedTo || String(partnerTask.assignedTo) === req.user.id);
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAssignedPartner && !isAdmin) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return res.json({
    orderId: order._id,
    status: order.status,
    messages: order.chatMessages || []
  });
});

router.post("/:orderId/chat", protect, async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  const isOwner = String(order.userId) === req.user.id;
  const partnerTask = await Task.findOne({ orderId: order._id });
  const isAssignedPartner =
    req.user.role === "partner" &&
    Boolean(partnerTask) &&
    (!partnerTask.assignedTo || String(partnerTask.assignedTo) === req.user.id);
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAssignedPartner && !isAdmin) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const text = String(req.body.text || "").trim();
  if (!text) {
    return res.status(400).json({ message: "Message text is required" });
  }

  const senderRole = isAdmin ? "admin" : req.user.role === "partner" ? "partner" : "user";

  order.chatMessages.push({
    senderId: req.user.id,
    senderRole,
    text
  });

  await order.save();
  await order.populate("chatMessages.senderId", "name role");

  return res.status(201).json({
    orderId: order._id,
    messages: order.chatMessages
  });
});

router.get("/:orderId", protect, async (req, res) => {
  const order = await Order.findOne({ _id: req.params.orderId, userId: req.user.id });
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  return res.json(order);
});

module.exports = router;
