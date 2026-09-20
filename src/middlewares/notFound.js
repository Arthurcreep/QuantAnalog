const {
  createAppError,
} = require("../errors/appError");

const notFound = (req, res, next) => {
  const error = createAppError({
    statusCode: 404,
    code: "ROUTE_NOT_FOUND",
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });

  next(error);
};

module.exports = notFound;