const sequelize = require("../../config/database");

const getHealthStatus = async () => {
  try {
    await sequelize.query("SELECT 1");

    return {
      status: "ok",
      service: "quantlog-api",
      database: "ok",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: "degraded",
      service: "quantlog-api",
      database: "error",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
};

module.exports = {
  getHealthStatus,
};