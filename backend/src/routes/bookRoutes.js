const express = require("express");
const Order = require("../models/Order");
const { protect } = require("../middleware/auth");

const router = express.Router();

const books = [
  { id: "b1", title: "Clean Code", author: "Robert C. Martin" },
  { id: "b2", title: "Designing Data-Intensive Applications", author: "Martin Kleppmann" },
  { id: "b3", title: "The Pragmatic Programmer", author: "Hunt & Thomas" }
];

router.get("/", (req, res) => {
  res.json(books);
});

router.post("/request", protect, async (req, res) => {
  const { title, location, slot = "Today 5 PM", borrowDays = 7 } = req.body;
  const days = Math.max(1, Number(borrowDays));
  const returnDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const returnDateFormatted = returnDate.toLocaleDateString("en-GB");

  const order = await Order.create({
    userId: req.user.id,
    items: [
      {
        name: title,
        category: "Library",
        price: 0,
        quantity: 1,
        borrowDays: days,
        returnDate: returnDateFormatted
      }
    ],
    preOrderSlot: slot,
    location,
    status: "Preparing",
    etaMinutes: 20
  });

  res.status(201).json({
    message: "Library delivery requested",
    returnDate: returnDateFormatted,
    borrowDays: days,
    order
  });
});

router.post("/return-pickup", protect, (req, res) => {
  const { title, slot } = req.body;
  res.json({ message: `${title} return pickup scheduled for ${slot}` });
});

module.exports = router;
