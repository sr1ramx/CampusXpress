const express = require("express");
const { protect } = require("../middleware/auth");
const RentItem = require("../models/RentItem");
const RentalRequest = require("../models/RentalRequest");

const router = express.Router();

const isRequestParticipant = (request, userId) =>
  String(request.lenderId) === userId || String(request.renterId) === userId;

const resolveSenderRole = (request, userId) =>
  String(request.lenderId) === userId ? "lender" : "renter";

router.get("/items", protect, async (req, res) => {
  const availabilityQuery = req.query.showUnavailable === "true" ? {} : { availability: true };
  const items = await RentItem.find(availabilityQuery).populate("ownerId", "name email").sort({ createdAt: -1 });
  res.json(items);
});

router.post("/items", protect, async (req, res) => {
  const {
    name,
    description,
    category = "Other",
    condition = "Good",
    location = "Campus",
    pricePerDay,
    images = [],
    availability = true
  } = req.body;

  if (!name || typeof name !== "string") {
    return res.status(400).json({ message: "Item name is required" });
  }

  const parsedPrice = Number(pricePerDay);
  if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
    return res.status(400).json({ message: "Price per day must be positive" });
  }

  const item = await RentItem.create({
    ownerId: req.user.id,
    name: name.trim(),
    description,
    category,
    condition,
    location,
    pricePerDay: parsedPrice,
    images,
    availability
  });

  res.status(201).json(item);
});

router.get("/mine", protect, async (req, res) => {
  const items = await RentItem.find({ ownerId: req.user.id }).sort({ createdAt: -1 });
  res.json(items);
});

router.patch("/items/:id", protect, async (req, res) => {
  const item = await RentItem.findById(req.params.id);
  if (!item) {
    return res.status(404).json({ message: "Rent item not found" });
  }

  if (String(item.ownerId) !== req.user.id) {
    return res.status(403).json({ message: "Only owner can update item" });
  }

  const allowedFields = ["availability", "pricePerDay", "description", "location", "condition", "category"];
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      item[field] = req.body[field];
    }
  }

  if (req.body.pricePerDay !== undefined) {
    const parsedPrice = Number(req.body.pricePerDay);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ message: "Price per day must be positive" });
    }
    item.pricePerDay = parsedPrice;
  }

  await item.save();
  return res.json(item);
});

router.delete("/items/:id", protect, async (req, res) => {
  const item = await RentItem.findById(req.params.id);
  if (!item) {
    return res.status(404).json({ message: "Rent item not found" });
  }

  if (String(item.ownerId) !== req.user.id) {
    return res.status(403).json({ message: "Only owner can delete item" });
  }

  await RentalRequest.deleteMany({ rentItemId: item._id, status: "Requested" });
  await item.deleteOne();

  return res.json({ message: "Rent item deleted" });
});

router.post("/request", protect, async (req, res) => {
  const { rentItemId, durationDays, contact } = req.body;
  const item = await RentItem.findById(rentItemId);

  if (!item || !item.availability) {
    return res.status(404).json({ message: "Rent item unavailable" });
  }

  if (String(item.ownerId) === req.user.id) {
    return res.status(400).json({ message: "You cannot rent your own listed item" });
  }

  const parsedDuration = Number(durationDays);
  if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
    return res.status(400).json({ message: "Duration must be at least 1 day" });
  }

  const existing = await RentalRequest.findOne({
    rentItemId,
    renterId: req.user.id,
    status: "Requested"
  });
  if (existing) {
    return res.status(400).json({ message: "You already requested this item" });
  }

  const totalCost = Number(item.pricePerDay) * parsedDuration;

  const request = await RentalRequest.create({
    rentItemId,
    lenderId: item.ownerId,
    renterId: req.user.id,
    durationDays: parsedDuration,
    negotiatedPricePerDay: Number(item.pricePerDay),
    totalCost,
    contact,
    messages: [
      {
        senderId: req.user.id,
        senderRole: "renter",
        text: contact || "Rental request created",
        offeredPricePerDay: Number(item.pricePerDay)
      }
    ]
  });

  res.status(201).json(request);
});

router.get("/requests", protect, async (req, res) => {
  const requests = await RentalRequest.find({
    $or: [{ lenderId: req.user.id }, { renterId: req.user.id }]
  })
    .populate("rentItemId")
    .populate("lenderId", "name email")
    .populate("renterId", "name email")
    .populate("messages.senderId", "name email")
    .sort({ createdAt: -1 });

  res.json(requests);
});

router.patch("/requests/:id/approve", protect, async (req, res) => {
  const request = await RentalRequest.findById(req.params.id);
  if (!request) {
    return res.status(404).json({ message: "Request not found" });
  }

  if (String(request.lenderId) !== req.user.id) {
    return res.status(403).json({ message: "Only lender can approve" });
  }

  request.status = "Approved";
  await request.save();

  res.json(request);
});

router.patch("/requests/:id/reject", protect, async (req, res) => {
  const request = await RentalRequest.findById(req.params.id);
  if (!request) {
    return res.status(404).json({ message: "Request not found" });
  }

  if (String(request.lenderId) !== req.user.id) {
    return res.status(403).json({ message: "Only lender can reject" });
  }

  request.status = "Rejected";
  await request.save();

  res.json(request);
});

router.patch("/requests/:id/cancel", protect, async (req, res) => {
  const request = await RentalRequest.findById(req.params.id);
  if (!request) {
    return res.status(404).json({ message: "Request not found" });
  }

  if (String(request.renterId) !== req.user.id) {
    return res.status(403).json({ message: "Only renter can cancel" });
  }

  if (request.status !== "Requested") {
    return res.status(400).json({ message: "Only requested rentals can be cancelled" });
  }

  request.status = "Rejected";
  await request.save();

  res.json(request);
});

router.get("/requests/:id/messages", protect, async (req, res) => {
  const request = await RentalRequest.findById(req.params.id).populate("messages.senderId", "name email");
  if (!request) {
    return res.status(404).json({ message: "Request not found" });
  }

  if (!isRequestParticipant(request, req.user.id)) {
    return res.status(403).json({ message: "Only request participants can view chat" });
  }

  return res.json({
    requestId: request._id,
    negotiatedPricePerDay: request.negotiatedPricePerDay,
    totalCost: request.totalCost,
    messages: request.messages || []
  });
});

router.post("/requests/:id/messages", protect, async (req, res) => {
  const request = await RentalRequest.findById(req.params.id);
  if (!request) {
    return res.status(404).json({ message: "Request not found" });
  }

  if (!isRequestParticipant(request, req.user.id)) {
    return res.status(403).json({ message: "Only request participants can message" });
  }

  const { text = "", offeredPricePerDay = 0 } = req.body;
  const trimmedText = String(text || "").trim();
  const parsedOffer = Number(offeredPricePerDay || 0);

  if (!trimmedText && (!Number.isFinite(parsedOffer) || parsedOffer <= 0)) {
    return res.status(400).json({ message: "Message text or valid offered price is required" });
  }

  const senderRole = resolveSenderRole(request, req.user.id);

  request.messages.push({
    senderId: req.user.id,
    senderRole,
    text: trimmedText,
    offeredPricePerDay: Number.isFinite(parsedOffer) && parsedOffer > 0 ? parsedOffer : 0
  });

  if (Number.isFinite(parsedOffer) && parsedOffer > 0) {
    request.negotiatedPricePerDay = parsedOffer;
    request.totalCost = parsedOffer * Number(request.durationDays || 1);
  }

  await request.save();
  await request.populate("messages.senderId", "name email");

  return res.status(201).json({
    requestId: request._id,
    negotiatedPricePerDay: request.negotiatedPricePerDay,
    totalCost: request.totalCost,
    messages: request.messages
  });
});

module.exports = router;
