const createApp = require("./src/app");
const env = require("./src/config/env");
const sequelize = require("./src/config/database");

const startServer = async () => {
  try {
    await sequelize.authenticate();

    console.log("PostgreSQL connection established");

    const app = createApp();

    app.listen(env.port, () => {
      console.log(`QuantLog API started on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start QuantLog:", error.message);

    process.exit(1);
  }
};

startServer();