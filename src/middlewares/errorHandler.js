const env = require("../config/env");

const errorHandler = (error, req, res, _next) => {
  const statusCode = error.statusCode || 500;
  const code = error.code || "INTERNAL_ERROR";

  if (statusCode >= 500) {
    console.error(error);
  }

  const message =
    statusCode >= 500 && env.nodeEnv === "production"
      ? "Internal server error"
      : error.message;

  res.status(statusCode).json({
    status: "error",
    error: {
      code,
      message,
      details: error.details || null,
    },
    timestamp: new Date().toISOString(),
  });
};

module.exports = errorHandler;