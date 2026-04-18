const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  const message = err?.message || "Internal server error";

  if (process.env.NODE_ENV === "production") {
    return res.status(statusCode).json({ message });
  }

  return res.status(statusCode).json({
    message,
    stack: err?.stack
  });
};

module.exports = {
  notFound,
  errorHandler
};
