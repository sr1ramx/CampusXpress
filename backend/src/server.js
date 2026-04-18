require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const recyclingRoutes = require("./routes/recyclingRoutes");
const taskRoutes = require("./routes/taskRoutes");
const adminRoutes = require("./routes/adminRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const bookRoutes = require("./routes/bookRoutes");
const rentRoutes = require("./routes/rentRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

connectDB();

const app = express();
app.use(cors());
app.use(express.json({ limit: "8mb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "CampusXpress API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/recycling", recyclingRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/rent", rentRoutes);

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`CampusXpress backend running on port ${port}`);
});
