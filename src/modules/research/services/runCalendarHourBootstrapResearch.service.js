const {
  findDatasetById,
} = require(
  "../../datasets/repositories/dataset.repository"
);

const {
  buildLogReturnSeries,
} = require(
  "../series/buildLogReturnSeries"
);

const {
  buildCalendarVolatilityMatrix,
} = require(
  "../matrix/buildCalendarVolatilityMatrix"
);

const {
  calculateCategoricalTargetProfile,
} = require(
  "../calculations/factors/calculateCategoricalTargetProfile"
);

const {
  calculateMovingBlockBootstrap,
} = require(
  "../calculations/factors/calculateMovingBlockBootstrap"
);

const {
  createAnalysisRun,
} = require(
  "../runs/analysisRun.repository"
);

const DATASET_TIMEFRAME =
  "1h";

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

const BLOCK_SIZE =
  168;

const ITERATIONS =
  2000;

const ENGINE_VERSION =
  "research-v1.5";

const getExtremes = (
  profile
) => {
  let low =
    profile[0];

  let high =
    profile[0];

  for (
    const item of profile
  ) {
    if (
      item.mean <
      low.mean
    ) {
      low = item;
    }

    if (
      item.mean >
      high.mean
    ) {
      high = item;
    }
  }

  return {
    lowHour:
      low.category,

    highHour:
      high.category,
  };
};

const runCalendarHourBootstrapResearch =
  async ({
    datasetId,
  }) => {
    const dataset =
      await findDatasetById(
        datasetId
      );

    if (!dataset) {
      throw new Error(
        "DATASET_NOT_FOUND"
      );
    }

    if (
      dataset.stage !==
        "PREPARED" ||
      dataset.sourceTimeframe !==
        DATASET_TIMEFRAME
    ) {
      throw new Error(
        "INVALID_BOOTSTRAP_DATASET"
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

    const results = [];

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

      const developmentRows =
        matrix.filter(
          (row) =>
            Date.parse(
              row.targetEndTimestamp
            ) <=
            DEVELOPMENT_END
        );

      const validationRows =
        matrix.filter(
          (row) =>
            Date.parse(
              row.timestamp
            ) >=
            VALIDATION_START
        );

      const developmentProfile =
        calculateCategoricalTargetProfile({
          rows:
            developmentRows,

          categoryField:
            "calendarHourUtc",

          targetField:
            "futureRealizedVolatility",
        });

      const {
        lowHour,
        highHour,
      } =
        getExtremes(
          developmentProfile
            .profile
        );

      const bootstrap =
        calculateMovingBlockBootstrap({
          rows:
            validationRows,

          categoryField:
            "calendarHourUtc",

          targetField:
            "futureRealizedVolatility",

          lowCategory:
            lowHour,

          highCategory:
            highHour,

          blockSize:
            BLOCK_SIZE,

          iterations:
            ITERATIONS,

          seed:
            20260921 +
            horizonBars,
        });

      results.push({
        horizon:
          `${horizonBars}h`,

        horizonBars,

        development: {
          rowCount:
            developmentRows.length,

          frozenLowHour:
            lowHour,

          frozenHighHour:
            highHour,
        },

        validation: {
          rowCount:
            validationRows.length,
        },

        bootstrap,
      });
    }

    const metrics = {
      blockSizeHours:
        BLOCK_SIZE,

      iterations:
        ITERATIONS,

      results,
    };

    const run =
      await createAnalysisRun({
        datasetId:
          dataset.id,

        runType:
          "CALENDAR_HOUR_BLOCK_BOOTSTRAP",

        engineVersion:
          ENGINE_VERSION,

        config: {
          feature:
            "CALENDAR_HOUR_UTC",

          target:
            "FUTURE_REALIZED_VOLATILITY",

          horizons:
            HORIZONS,

          blockSizeHours:
            BLOCK_SIZE,

          iterations:
            ITERATIONS,

          datasetChecksum:
            dataset.checksum,

          selectionRule:
            "HIGH_LOW_HOURS_SELECTED_ON_DEVELOPMENT_ONLY",
        },

        metrics,
      });

    return {
      analysisRunId:
        run.id,

      engineVersion:
        ENGINE_VERSION,

      metrics,
    };
  };

module.exports = {
  runCalendarHourBootstrapResearch,
};