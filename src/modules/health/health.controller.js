const {
  getHealthStatus,
} = require("./health.service");

const getHealth = async (req, res) => {
  const health = await getHealthStatus();

  const statusCode = health.status === "ok" ? 200 : 503;

  res.status(statusCode).json(health);
};

module.exports = {
  getHealth,
};