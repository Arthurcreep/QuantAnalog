const {
  findDatasetById,
} = require(
  "../../datasets/repositories/dataset.repository"
);

const {
  timeframeToMilliseconds,
} = require(
  "../../datasets/calculations/timeframeToMilliseconds"
);

const {
  buildLogReturnSeries,
} = require(
  "../../research/series/buildLogReturnSeries"
);

const {
  findForecastById,
} = require(
  "../forecasts/forecast.repository"
);

const {
  createForecastOutcome,
  findForecastOutcomeByForecastId,
} = require(
  "../outcomes/forecastOutcome.repository"
);

const {
  buildRealizedVolatilityOutcome,
} = require(
  "../outcomes/buildRealizedVolatilityOutcome"
);

const {
  createAppError,
} = require(
  "../../../errors/appError"
);

const ENGINE_VERSION =
  "forecast-maturity-v1.0";

const INCOMPLETE_POLICY =
  "DROP_INCOMPLETE";

const validateDatasetCompatibility = ({
  forecastDataset,
  actualDataset,
  forecast,
}) => {
  if (
    forecastDataset.checksum !==
    forecast.datasetChecksum
  ) {
    throw new Error(
      "FORECAST_SOURCE_DATASET_CHECKSUM_MISMATCH"
    );
  }

  if (
    actualDataset.stage !==
    "PREPARED"
  ) {
    throw new Error(
      "FORECAST_OUTCOME_REQUIRES_PREPARED_DATASET"
    );
  }

  if (
    actualDataset.venue !==
    forecastDataset.venue
  ) {
    throw new Error(
      "FORECAST_OUTCOME_VENUE_MISMATCH"
    );
  }

  if (
    actualDataset.instrument !==
    forecastDataset.instrument
  ) {
    throw new Error(
      "FORECAST_OUTCOME_INSTRUMENT_MISMATCH"
    );
  }

  if (
    actualDataset.marketType !==
    forecastDataset.marketType
  ) {
    throw new Error(
      "FORECAST_OUTCOME_MARKET_TYPE_MISMATCH"
    );
  }

  if (
    actualDataset.sourceTimeframe !==
    forecast.modelTimeframe
  ) {
    throw new Error(
      "FORECAST_OUTCOME_TIMEFRAME_MISMATCH"
    );
  }
};

const matureForecast =
  async ({
    forecastId,
    actualDatasetId = null,
    observedAt,
  }, options = {}) => {
    const forecast =
      await findForecastById(
        forecastId,
        options
      );

    if (!forecast) {
      throw createAppError({
        statusCode:
          404,

        code:
          "FORECAST_NOT_FOUND",

        message:
          `Forecast ${forecastId} not found`,
      });
    }

    const existingOutcome =
      await findForecastOutcomeByForecastId(
        forecast.id,
        options
      );

    if (existingOutcome) {
      if (
        actualDatasetId &&
        existingOutcome
          .actualDatasetId !==
          actualDatasetId
      ) {
        throw new Error(
          "FORECAST_OUTCOME_DATASET_CONFLICT"
        );
      }

      return {
        created:
          false,

        engineVersion:
          ENGINE_VERSION,

        forecast,

        outcome:
          existingOutcome,
      };
    }

    const observedAtMs =
      new Date(
        observedAt
      ).getTime();

    if (
      !Number.isFinite(
        observedAtMs
      )
    ) {
      throw new Error(
        "INVALID_FORECAST_OUTCOME_OBSERVED_AT"
      );
    }

    const targetWindowEndMs =
      new Date(
        forecast
          .targetWindowEndAt
      ).getTime();

    if (
      observedAtMs <
      targetWindowEndMs
    ) {
      throw new Error(
        "FORECAST_NOT_MATURE"
      );
    }

    if (
      forecast.target !==
      "FUTURE_REALIZED_VOLATILITY"
    ) {
      throw new Error(
        "FORECAST_OUTCOME_TARGET_NOT_SUPPORTED"
      );
    }

    const resolvedActualDatasetId =
      actualDatasetId ||
      forecast.datasetId;

    const [
      forecastDataset,
      actualDataset,
    ] =
      await Promise.all([
        findDatasetById(
          forecast.datasetId,
          options
        ),

        findDatasetById(
          resolvedActualDatasetId,
          options
        ),
      ]);

    if (!forecastDataset) {
      throw createAppError({
        statusCode:
          404,

        code:
          "FORECAST_SOURCE_DATASET_NOT_FOUND",

        message:
          `Dataset ${forecast.datasetId} not found`,
      });
    }

    if (!actualDataset) {
      throw createAppError({
        statusCode:
          404,

        code:
          "FORECAST_ACTUAL_DATASET_NOT_FOUND",

        message:
          `Dataset ${resolvedActualDatasetId} not found`,
      });
    }

    validateDatasetCompatibility({
      forecastDataset,
      actualDataset,
      forecast,
    });

    const timeframeMs =
      timeframeToMilliseconds(
        forecast.modelTimeframe
      );

    if (
      !Number.isFinite(
        timeframeMs
      ) ||
      timeframeMs <= 0
    ) {
      throw new Error(
        "UNSUPPORTED_FORECAST_OUTCOME_TIMEFRAME"
      );
    }

    const returns =
      await buildLogReturnSeries({
        filePath:
          actualDataset
            .storageUri,

        timeframe:
          forecast
            .modelTimeframe,

        incompletePolicy:
          INCOMPLETE_POLICY,
      });

    const outcomeResult =
      buildRealizedVolatilityOutcome({
        series:
          returns.series,

        targetWindowStartAt:
          forecast
            .targetWindowStartAt,

        targetWindowEndAt:
          forecast
            .targetWindowEndAt,

        expectedIntervalMs:
          timeframeMs,
      });

    if (
      new Date(
        outcomeResult
          .lastReturnAvailableAt
      ).getTime() >
      observedAtMs
    ) {
      throw new Error(
        "FORECAST_OUTCOME_INFORMATION_NOT_YET_AVAILABLE"
      );
    }

    const outcome =
      await createForecastOutcome(
        {
          forecastId:
            forecast.id,

          actualDatasetId:
            actualDataset.id,

          actualDatasetChecksum:
            actualDataset.checksum,

          actual: {
            ...outcomeResult.actual,

            horizonBars:
              outcomeResult
                .horizonBars,

            targetWindowStartAt:
              outcomeResult
                .targetWindowStartAt,

            targetWindowEndAt:
              outcomeResult
                .targetWindowEndAt,

            firstReturnTimestamp:
              outcomeResult
                .firstReturnTimestamp,

            lastReturnTimestamp:
              outcomeResult
                .lastReturnTimestamp,
          },

          observedAt:
            new Date(
              observedAtMs
            ),
        },
        options
      );

    return {
      created:
        true,

      engineVersion:
        ENGINE_VERSION,

      forecast,

      outcome,

      target: {
        horizonBars:
          outcomeResult
            .horizonBars,

        firstReturnTimestamp:
          outcomeResult
            .firstReturnTimestamp,

        lastReturnTimestamp:
          outcomeResult
            .lastReturnTimestamp,

        lastReturnAvailableAt:
          outcomeResult
            .lastReturnAvailableAt,
      },

      source: {
        actualDatasetId:
          actualDataset.id,

        actualDatasetChecksum:
          actualDataset
            .checksum,

        returnCount:
          returns.returnCount,
      },
    };
  };

module.exports = {
  ENGINE_VERSION,
  matureForecast,
};