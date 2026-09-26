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
  buildCalendarVolatilityMatrix,
} = require(
  "../src/modules/research/matrix/buildCalendarVolatilityMatrix"
);

const DATASET_ID =
  "f10885c8-f99e-494e-9ad4-fc0f5c385f26";

const HORIZON_BARS =
  24;

const ONE_HOUR_MS =
  60 * 60 * 1000;

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

    const matrix =
      buildCalendarVolatilityMatrix({
        returnSeries:
          returns.series,

        horizonBars:
          HORIZON_BARS,

        expectedIntervalMs:
          ONE_HOUR_MS,
      });

    console.log(
      "\n===== FEATURE TARGET MATRIX ====="
    );

    console.log({
      instrument:
        dataset.instrument,

      timeframe:
        dataset.sourceTimeframe,

      returnCount:
        returns.returnCount,

      horizonBars:
        HORIZON_BARS,

      matrixRows:
        matrix.length,

      first:
        matrix[0],

      last:
        matrix[
          matrix.length - 1
        ],
    });

    console.log(
      "\n===== SAMPLE ====="
    );

    console.table(
      matrix.slice(
        0,
        10
      )
    );
  } catch (error) {
    console.error(
      "Feature-target matrix failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();