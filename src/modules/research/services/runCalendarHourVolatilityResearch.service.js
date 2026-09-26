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
  compareCategoricalProfiles,
} = require(
  "../calculations/factors/calculateCategoricalTargetProfile"
);

const {
  createAnalysisRun,
} = require(
  "../runs/analysisRun.repository"
);

const {
  createAppError,
} = require(
  "../../../errors/appError"
);

const ENGINE_VERSION =
  "research-v1.3";

const DEVELOPMENT_END =
  Date.parse(
    "2024-12-31T23:59:59.999Z"
  );

const VALIDATION_START =
  Date.parse(
    "2025-01-01T00:00:00.000Z"
  );

const HORIZON_BARS = 24;

const ONE_HOUR_MS =
  60 * 60 * 1000;

const runCalendarHourVolatilityResearch =
  async ({
    datasetId,
  }) => {
    const dataset =
      await findDatasetById(
        datasetId
      );

    if (!dataset) {
      throw createAppError({
        statusCode: 404,
        code:
          "DATASET_NOT_FOUND",
        message:
          `Dataset ${datasetId} not found`,
      });
    }

    if (
      dataset.stage !==
        "PREPARED" ||
      dataset.sourceTimeframe !==
        "1h"
    ) {
      throw createAppError({
        statusCode: 400,
        code:
          "INVALID_HOUR_FACTOR_DATASET",
        message:
          "This protocol requires PREPARED 1h data",
      });
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

    const developmentRows =
      matrix.filter(
        (row) =>
          Date.parse(
            row.timestamp
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

    const development =
      calculateCategoricalTargetProfile({
        rows:
          developmentRows,

        categoryField:
          "calendarHourUtc",

        targetField:
          "futureRealizedVolatility",
      });

    const validation =
      calculateCategoricalTargetProfile({
        rows:
          validationRows,

        categoryField:
          "calendarHourUtc",

        targetField:
          "futureRealizedVolatility",
      });

    const stability =
      compareCategoricalProfiles({
        first:
          development.profile,

        second:
          validation.profile,
      });

    const metrics = {
      sample: {
        matrixRows:
          matrix.length,

        developmentRows:
          developmentRows.length,

        validationRows:
          validationRows.length,
      },

      development,

      retrospectiveValidation:
        validation,

      stability,
    };

    const run =
      await createAnalysisRun({
        datasetId:
          dataset.id,

        runType:
          "CALENDAR_HOUR_FUTURE_RV",

        engineVersion:
          ENGINE_VERSION,

        config: {
          feature:
            "CALENDAR_HOUR_UTC",

          target:
            "FUTURE_REALIZED_VOLATILITY",

          timeframe:
            "1h",

          horizonBars:
            HORIZON_BARS,

          horizon:
            "24h",

          incompletePolicy:
            "DROP_INCOMPLETE",

          developmentEnd:
            new Date(
              DEVELOPMENT_END
            ).toISOString(),

          validationStart:
            new Date(
              VALIDATION_START
            ).toISOString(),

          datasetChecksum:
            dataset.checksum,
        },

        metrics,
      });

    return {
      analysisRunId:
        run.id,

      datasetId:
        dataset.id,

      engineVersion:
        ENGINE_VERSION,

      metrics,
    };
  };

module.exports = {
  runCalendarHourVolatilityResearch,
};