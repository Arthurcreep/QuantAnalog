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
  MODEL_DEFINITION,
  forecastHistoricalVolatilityBaseline,
} = require(
  "../models/historicalVolatilityBaselineV1"
);

const {
  issueForecast,
} = require(
  "./issueForecast.service"
);

const {
  createAppError,
} = require(
  "../../../errors/appError"
);

const DEFAULT_LOOKBACK_BARS =
  168;

const DEFAULT_HORIZON_BARS =
  1;

const INCOMPLETE_POLICY =
  "DROP_INCOMPLETE";

const toHorizonLabel = (
  milliseconds
) => {
  const minuteMs =
    60 * 1000;

  const hourMs =
    60 * minuteMs;

  const dayMs =
    24 * hourMs;

  if (
    milliseconds %
      dayMs ===
    0
  ) {
    return `${
      milliseconds /
      dayMs
    }d`;
  }

  if (
    milliseconds %
      hourMs ===
    0
  ) {
    return `${
      milliseconds /
      hourMs
    }h`;
  }

  if (
    milliseconds %
      minuteMs ===
    0
  ) {
    return `${
      milliseconds /
      minuteMs
    }m`;
  }

  throw new Error(
    "UNSUPPORTED_FORECAST_HORIZON_LABEL"
  );
};

const filterReturnsAvailableAt = ({
  series,
  inputCutoffAt,
  timeframeMs,
}) => {
  const cutoffMs =
    new Date(
      inputCutoffAt
    ).getTime();

  if (
    !Number.isFinite(
      cutoffMs
    )
  ) {
    throw new Error(
      "INVALID_FORECAST_INPUT_CUTOFF"
    );
  }

  return series.filter(
    (row) => {
      const candleStartMs =
        new Date(
          row.timestamp
        ).getTime();

      if (
        !Number.isFinite(
          candleStartMs
        )
      ) {
        throw new Error(
          "INVALID_FORECAST_RETURN_TIMESTAMP"
        );
      }

      const availableAtMs =
        candleStartMs +
        timeframeMs;

      return (
        availableAtMs <=
        cutoffMs
      );
    }
  );
};

const runHistoricalVolatilityForecast =
  async ({
    datasetId,
    issuedAt,
    lookbackBars =
      DEFAULT_LOOKBACK_BARS,
    horizonBars =
      DEFAULT_HORIZON_BARS,
  }, options = {}) => {
    const dataset =
      await findDatasetById(
        datasetId,
        options
      );

    if (!dataset) {
      throw createAppError({
        statusCode:
          404,

        code:
          "FORECAST_DATASET_NOT_FOUND",

        message:
          `Dataset ${datasetId} not found`,
      });
    }

    if (
      dataset.stage !==
      "PREPARED"
    ) {
      throw createAppError({
        statusCode:
          400,

        code:
          "FORECAST_REQUIRES_PREPARED_DATASET",

        message:
          "Historical volatility forecast requires PREPARED data",
      });
    }

    const timeframe =
      dataset.sourceTimeframe;

    const timeframeMs =
      timeframeToMilliseconds(
        timeframe
      );

    if (
      !Number.isFinite(
        timeframeMs
      ) ||
      timeframeMs <= 0
    ) {
      throw new Error(
        "UNSUPPORTED_FORECAST_TIMEFRAME"
      );
    }

    if (
      !Number.isInteger(
        lookbackBars
      ) ||
      lookbackBars <= 0
    ) {
      throw new Error(
        "INVALID_FORECAST_LOOKBACK_BARS"
      );
    }

    if (
      !Number.isInteger(
        horizonBars
      ) ||
      horizonBars <= 0
    ) {
      throw new Error(
        "INVALID_FORECAST_HORIZON_BARS"
      );
    }

    const issuedAtMs =
      new Date(
        issuedAt
      ).getTime();

    if (
      !Number.isFinite(
        issuedAtMs
      )
    ) {
      throw new Error(
        "INVALID_FORECAST_ISSUE_TIME"
      );
    }

    /*
     * First vertical slice:
     * issue forecasts exactly on
     * timeframe boundaries.
     */

    if (
      issuedAtMs %
        timeframeMs !==
      0
    ) {
      throw new Error(
        "FORECAST_ISSUE_TIME_NOT_ALIGNED"
      );
    }

    const returns =
      await buildLogReturnSeries({
        filePath:
          dataset.storageUri,

        timeframe,

        incompletePolicy:
          INCOMPLETE_POLICY,
      });

    /*
     * Candle timestamp identifies
     * bucket start.
     *
     * Its close and therefore its
     * log return become known only at:
     *
     * timestamp + timeframeMs
     */

    const availableSeries =
      filterReturnsAvailableAt({
        series:
          returns.series,

        inputCutoffAt:
          issuedAt,

        timeframeMs,
      });

    const modelResult =
      forecastHistoricalVolatilityBaseline({
        series:
          availableSeries,

        lookbackBars,

        horizonBars,

        expectedIntervalMs:
          timeframeMs,
      });

    const horizonMs =
      timeframeMs *
      horizonBars;

    const horizon =
      toHorizonLabel(
        horizonMs
      );

    const targetWindowStartAt =
      new Date(
        issuedAtMs
      );

    const targetWindowEndAt =
      new Date(
        issuedAtMs +
        horizonMs
      );

    const modelConfig = {
      lookbackBars,

      horizonBars,

      incompletePolicy:
        INCOMPLETE_POLICY,

      informationAvailability:
        "CANDLE_CLOSE_EQUALS_CANDLE_TIMESTAMP_PLUS_TIMEFRAME",
    };

    const issuance =
      await issueForecast(
        {
          datasetId:
            dataset.id,

          sourceAnalysisRunId:
            null,

          modelId:
            MODEL_DEFINITION.id,

          modelVersion:
            MODEL_DEFINITION.version,

          modelDefinition:
            MODEL_DEFINITION,

          modelConfig,

          target:
            MODEL_DEFINITION.target,

          modelTimeframe:
            timeframe,

          horizon,

          issuedAt:
            new Date(
              issuedAtMs
            ),

          inputCutoffAt:
            new Date(
              issuedAtMs
            ),

          targetWindowStartAt,

          targetWindowEndAt,

          prediction:
            modelResult
              .prediction,
        },
        options
      );

    const lastReturnTimestamp =
      modelResult
        .sample
        .lastTimestamp;

    const lastReturnAvailableAt =
      new Date(
        new Date(
          lastReturnTimestamp
        ).getTime() +
        timeframeMs
      ).toISOString();

    return {
      engineVersion:
        "historical-volatility-forecast-v1.0",

      created:
        issuance.created,

      forecast:
        issuance.forecast,

      modelResult,

      informationSet: {
        datasetId:
          dataset.id,

        datasetChecksum:
          dataset.checksum,

        timeframe,

        inputReturnCount:
          returns.returnCount,

        availableReturnCount:
          availableSeries.length,

        lookbackBars,

        firstUsedReturnTimestamp:
          modelResult
            .sample
            .firstTimestamp,

        lastUsedReturnTimestamp:
          lastReturnTimestamp,

        lastUsedReturnAvailableAt:
          lastReturnAvailableAt,

        inputCutoffAt:
          new Date(
            issuedAtMs
          ).toISOString(),
      },
    };
  };

module.exports = {
  DEFAULT_LOOKBACK_BARS,
  DEFAULT_HORIZON_BARS,
  runHistoricalVolatilityForecast,
};