const validateCreateOrder = (req, res, next) => {
  const { items, location, paymentMethod, deliveryType, scheduledDate, scheduledTime } = req.body;

  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ message: "Cart is empty" });
  }

  const hasInvalidItem = items.some(
    (item) =>
      !item ||
      typeof item.name !== "string" ||
      !item.name.trim() ||
      typeof item.quantity !== "number" ||
      item.quantity < 1 ||
      typeof item.price !== "number" ||
      item.price < 0
  );

  if (hasInvalidItem) {
    return res.status(400).json({ message: "Invalid order items" });
  }

  if (!location || typeof location.lat !== "number" || typeof location.lng !== "number") {
    return res.status(400).json({ message: "Valid delivery location is required" });
  }

  if (paymentMethod && !["UPI", "Card", "Wallet", "Cash"].includes(paymentMethod)) {
    return res.status(400).json({ message: "Unsupported payment method" });
  }

  if (deliveryType && !["Instant", "Scheduled"].includes(deliveryType)) {
    return res.status(400).json({ message: "Invalid delivery type" });
  }

  if (deliveryType === "Scheduled" && (!scheduledDate || !scheduledTime)) {
    return res.status(400).json({ message: "Scheduled delivery requires date and time" });
  }

  return next();
};

const validateRecycleRequest = (req, res, next) => {
  const { material, itemType, quantity, location } = req.body;

  if (!["plastic", "paper", "metal"].includes(material)) {
    return res.status(400).json({ message: "Invalid material type" });
  }

  if (!itemType || typeof itemType !== "string") {
    return res.status(400).json({ message: "Item type is required" });
  }

  const parsedQuantity = Number(quantity);
  if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
    return res.status(400).json({ message: "Quantity must be a positive number" });
  }

  if (!location || typeof location.lat !== "number" || typeof location.lng !== "number") {
    return res.status(400).json({ message: "Pickup location is required" });
  }

  return next();
};

module.exports = {
  validateCreateOrder,
  validateRecycleRequest
};
