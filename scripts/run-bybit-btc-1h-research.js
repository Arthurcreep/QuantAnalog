const sequelize = require(
  "../src/config/database"
);

const {
  runReturnResearch,
} = require(
  "../src/modules/research/services/runReturnResearch.service"
);

const PREPARED_DATASET_ID =
  "f10885c8-f99e-494e-9ad4-fc0f5c385f26";

const run = async () => {
  try {
    await sequelize.authenticate();

    console.log(
      "Running BTCUSDT 1h return research..."
    );

    const result =
      await runReturnResearch({
        datasetId:
          PREPARED_DATASET_ID,

        incompletePolicy:
          "DROP_INCOMPLETE",

        maxLag: 40,

        quantiles: [
          0.01,
          0.05,
          0.25,
          0.5,
          0.75,
          0.95,
          0.99,
        ],
      });

    console.dir(
      result,
      {
        depth: null,
      }
    );

    console.log(
      "BTCUSDT 1h research completed"
    );
  } catch (error) {
    console.error(
      "BTCUSDT 1h research failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();