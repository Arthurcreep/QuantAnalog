const createAppError = ({
  statusCode = 500,
  code = "INTERNAL_ERROR",
  message = "Internal server error",
  details = null,
}) => {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.code = code;
  error.details = details;

  return error;
};

module.exports = {
  createAppError,
};