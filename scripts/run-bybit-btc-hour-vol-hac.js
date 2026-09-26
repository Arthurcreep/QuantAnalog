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

const {
  calculateCategoricalHacTest,
} = require(
  "../src/modules/research/calculations/factors/calculateCategoricalHacTest"
);

const {
  applyBenjaminiHochberg,
} = require(
  "../src/modules/research/calculations/applyBenjaminiHochberg"
);

const DATASET_ID =
  "f10885c8-f99e-494e-9ad4-fc0f5c385f26";

const ONE_HOUR_MS =
  60 * 60 * 1000;

const DEVELOPMENT_END =
  Date.parse(
    "2024-12-31T23:59:59.999Z"
  );

const VALIDATION_START =
  Date.parse(
    "2025-01-01T00:00:00.000Z"
  );

const HORIZONS = [
  1,
  4,
  6,
  12,
  24,
];

const runTests = ({
  returns,
  startTime,
  endTime,
}) => {
  const tests = [];

  for (
    const horizonBars of
    HORIZONS
  ) {
    const matrix =
      buildCalendarVolatilityMatrix({
        returnSeries:
          returns.series,

        horizonBars,

        expectedIntervalMs:
          ONE_HOUR_MS,
      });

    const rows =
      matrix.filter(
        (row) => {
          const featureTime =
            Date.parse(
              row.timestamp
            );

          const targetEnd =
            Date.parse(
              row.targetEndTimestamp
            );

          return (
            featureTime >=
              startTime &&
            featureTime <=
              endTime &&
            targetEnd <=
              endTime
          );
        }
      );

    /*
     * At least as long as overlapping
     * target window, plus a full daily cycle.
     */
    const hacLag =
      Math.max(
        horizonBars,
        24
      );

    const result =
      calculateCategoricalHacTest({
        rows,

        categoryField:
          "calendarHourUtc",

        targetField:
          "futureRealizedVolatility",

        categoryCount: 24,

        hacLag,
      });

    tests.push({
      horizon:
        `${horizonBars}h`,

      horizonBars,

      sampleSize:
        result.sampleSize,

      hacLag:
        result.hacLag,

      statistic:
        result.statistic,

      degreesOfFreedom:
        result
          .degreesOfFreedom,

      pValue:
        result.pValue,
    });
  }

  return applyBenjaminiHochberg(
    tests
  );
};

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

    console.log(
      "\n===== DEVELOPMENT HAC ====="
    );

    const development =
      runTests({
        returns,

        startTime:
          Number.NEGATIVE_INFINITY,

        endTime:
          DEVELOPMENT_END,
      });

    console.table(
      development
    );

    console.log(
      "\n===== VALIDATION HAC ====="
    );

    const validation =
      runTests({
        returns,

        startTime:
          VALIDATION_START,

        endTime:
          Number.POSITIVE_INFINITY,
      });

    console.table(
      validation
    );
  } catch (error) {
    console.error(
      "HAC factor validation failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();