const { validateSeriesContinuity } = require("../src/modules/research/series/validateSeriesContinuity");
const { timeframeToMilliseconds } = require("../src/modules/datasets/calculations/timeframeToMilliseconds");
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
  calculateVolatilityAcf,
} = require(
  "../src/modules/research/calculations/calculateVolatilityAcf"
);

const {
  calculateRollingRealizedVolatility,
} = require(
  "../src/modules/research/calculations/calculateRollingRealizedVolatility"
);

const DATASET_ID =
  "f10885c8-f99e-494e-9ad4-fc0f5c385f26";

const DISPLAY_LAGS = [
  1,
  2,
  3,
  6,
  12,
  24,
  40,
];

const selectLags = (
  acf
) =>
  acf.filter(
    (item) =>
      DISPLAY_LAGS.includes(
        item.lag
      )
  );

const getLast = (
  values
) =>
  values.length > 0
    ? values[
        values.length - 1
      ]
    : null;

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

    const returns =
      await buildLogReturnSeries({
        filePath:
          dataset.storageUri,

        timeframe:
          dataset.sourceTimeframe,

        incompletePolicy:
          "DROP_INCOMPLETE",
      });

    const expectedIntervalMs = timeframeToMilliseconds(dataset.sourceTimeframe);
    validateSeriesContinuity({ series: returns.series, expectedIntervalMs });

    const values =
      returns.series.map(
        (item) =>
          item.logReturn
      );

    console.log({
      timeframe:
        dataset.sourceTimeframe,

      candles:
        returns.inputRowCount,

      returns:
        returns.returnCount,

      skippedIncomplete:
        returns
          .skippedIncompleteCount,

      skippedGapReturns:
        returns
          .skippedGapReturnCount,
    });

    const acf =
      calculateVolatilityAcf({
        returns:
          values,

        maxLag: 40,
      });

    console.log(
      "\n===== ACF RETURNS ====="
    );

    console.table(
      selectLags(
        acf.returns
      )
    );

    console.log(
      "\n===== ACF ABSOLUTE RETURNS ====="
    );

    console.table(
      selectLags(
        acf.absoluteReturns
      )
    );

    console.log(
      "\n===== ACF SQUARED RETURNS ====="
    );

    console.table(
      selectLags(
        acf.squaredReturns
      )
    );

    const rolling24h =
      calculateRollingRealizedVolatility({
        series:
          returns.series,

        expectedIntervalMs,
        windowSize: 24,
      });

    const rolling7d =
      calculateRollingRealizedVolatility({
        series:
          returns.series,

        expectedIntervalMs,
        windowSize: 168,
      });

    const rolling30d =
      calculateRollingRealizedVolatility({
        series:
          returns.series,

        expectedIntervalMs,
        windowSize: 720,
      });

    console.log(
      "\n===== LATEST REALIZED VOLATILITY ====="
    );

    console.dir(
      {
        "24h":
          getLast(
            rolling24h
          ),

        "7d":
          getLast(
            rolling7d
          ),

        "30d":
          getLast(
            rolling30d
          ),
      },
      {
        depth: null,
      }
    );

    console.log(
      "\nBTCUSDT 1h volatility diagnostics completed"
    );
  } catch (error) {
    console.error(
      "BTCUSDT volatility diagnostics failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();