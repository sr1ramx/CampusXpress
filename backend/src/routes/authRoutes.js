const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role = "user", phone = "", language = "en" } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role, phone, language });

    return res.status(201).json({
      token: signToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
        phone: user.phone,
        language: user.language,
        preferences: user.preferences
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.json({
      token: signToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
        phone: user.phone,
        language: user.language,
        preferences: user.preferences
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/me", protect, async (req, res) => {
  const user = await User.findById(req.user.id, "name email role points phone language preferences");
  return res.json(user);
});

router.patch("/me", protect, async (req, res) => {
  const { name, phone, language, preferences } = req.body;
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (typeof name === "string") user.name = name;
  if (typeof phone === "string") user.phone = phone;
  if (typeof language === "string") user.language = language;

  if (preferences && typeof preferences === "object") {
    user.preferences = {
      ...user.preferences,
      ...preferences
    };
  }

  await user.save();

  return res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    points: user.points,
    phone: user.phone,
    language: user.language,
    preferences: user.preferences
  });
});

module.exports = router;
