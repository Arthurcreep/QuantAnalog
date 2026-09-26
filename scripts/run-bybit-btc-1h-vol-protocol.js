const sequelize = require(
  "../src/config/database"
);

const {
  runVolatilityStructureResearch,
} = require(
  "../src/modules/research/services/runVolatilityStructureResearch.service"
);

const DATASET_ID =
  "f10885c8-f99e-494e-9ad4-fc0f5c385f26";

const run = async () => {
  try {
    await sequelize.authenticate();

    console.log(
      "Running BTCUSDT 1h volatility protocol..."
    );

    const result =
      await runVolatilityStructureResearch({
        datasetId:
          DATASET_ID,
      });

    console.dir(
      result,
      {
        depth: null,
      }
    );

    console.log(
      "BTCUSDT 1h volatility protocol completed"
    );
  } catch (error) {
    console.error(
      "BTCUSDT volatility protocol failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();