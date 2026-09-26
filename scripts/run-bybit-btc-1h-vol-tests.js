const sequelize = require(
  "../src/config/database"
);

const {
  findDatasetById,
} = require(
  "../src/modules/datasets/repositories/dataset.repository"
);

const {
  buildLogReturnSeries,
} = require(
  "../src/modules/research/series/buildLogReturnSeries"
);

const {
  calculateLjungBox,
} = require(
  "../src/modules/research/calculations/calculateLjungBox"
);

const {
  calculateArchLm,
} = require(
  "../src/modules/research/calculations/calculateArchLm"
);

const DATASET_ID =
  "f10885c8-f99e-494e-9ad4-fc0f5c385f26";

const TEST_LAGS = [
  10,
  20,
  40,
];

const run = async () => {
  try {
    await sequelize.authenticate();

    const dataset =
      await findDatasetById(
        DATASET_ID
      );

    if (!dataset) {
      throw new Error(
        "DATASET_NOT_FOUND"
      );
    }

    const returnsResult =
      await buildLogReturnSeries({
        filePath:
          dataset.storageUri,

        timeframe:
          dataset.sourceTimeframe,

        incompletePolicy:
          "DROP_INCOMPLETE",
      });

    const returns =
      returnsResult.series.map(
        (item) =>
          item.logReturn
      );

    const squaredReturns =
      returns.map(
        (value) =>
          value ** 2
      );

    console.log({
      timeframe:
        dataset.sourceTimeframe,

      returnCount:
        returns.length,

      skippedIncomplete:
        returnsResult
          .skippedIncompleteCount,

      skippedGapReturns:
        returnsResult
          .skippedGapReturnCount,
    });

    console.log(
      "\n===== LJUNG-BOX RETURNS ====="
    );

    console.table(
      TEST_LAGS.map(
        (lags) =>
          calculateLjungBox({
            values: returns,
            lags,
          })
      )
    );

    console.log(
      "\n===== LJUNG-BOX SQUARED RETURNS ====="
    );

    console.table(
      TEST_LAGS.map(
        (lags) =>
          calculateLjungBox({
            values:
              squaredReturns,
            lags,
          })
      )
    );

    console.log(
      "\n===== ARCH-LM ====="
    );

    console.table(
      TEST_LAGS.map(
        (lags) =>
          calculateArchLm({
            returns,
            lags,
          })
      )
    );

    console.log(
      "\nBTCUSDT 1h volatility tests completed"
    );
  } catch (error) {
    console.error(
      "BTCUSDT volatility tests failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();