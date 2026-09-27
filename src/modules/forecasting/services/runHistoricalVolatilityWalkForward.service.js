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
  createAnalysisRun,
} = require(
  "../../research/runs/analysisRun.repository"
);

const {
  MODEL_DEFINITION,
} = require(
  "../models/historicalVolatilityBaselineV1"
);

const {
  evaluateHistoricalVolatilityBaseline,
} = require(
  "../walkForward/evaluateHistoricalVolatilityBaseline"
);

const {
  DEFAULT_VARIANCE_FLOOR,
} = require(
  "../evaluation/calculateVolatilityForecastScores"
);

const {
  calculateObjectChecksum,
} = require(
  "../../../shared/hash/calculateObjectChecksum"
);

const {
  createAppError,
} = require(
  "../../../errors/appError"
);

const ENGINE_VERSION =
  "forecast-walk-forward-v1.0";

const RUN_TYPE =
  "FORECAST_WALK_FORWARD";

const INCOMPLETE_POLICY =
  "DROP_INCOMPLETE";

const runHistoricalVolatilityWalkForward =
  async ({
    datasetId,
    lookbackBars,
    horizonBars,
    evaluationStartAt,
    evaluationEndAt,
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
      throw new Error(
        "FORECAST_WALK_FORWARD_REQUIRES_PREPARED_DATASET"
      );
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
        "UNSUPPORTED_FORECAST_WALK_FORWARD_TIMEFRAME"
      );
    }

    if (
      !Number.isInteger(
        lookbackBars
      ) ||
      lookbackBars <= 0
    ) {
      throw new Error(
        "INVALID_FORECAST_WALK_FORWARD_LOOKBACK"
      );
    }

    if (
      !Number.isInteger(
        horizonBars
      ) ||
      horizonBars <= 0
    ) {
      throw new Error(
        "INVALID_FORECAST_WALK_FORWARD_HORIZON"
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

    const evaluation =
      evaluateHistoricalVolatilityBaseline({
        series:
          returns.series,

        lookbackBars,

        horizonBars,

        expectedIntervalMs:
          timeframeMs,

        evaluationStartAt,

        evaluationEndAt,
      });

    const modelChecksum =
      calculateObjectChecksum(
        MODEL_DEFINITION
      );

    const firstForecast =
      evaluation.rows[0] ||
      null;

    const lastForecast =
      evaluation.rows[
        evaluation.rows.length - 1
      ] || null;

    const metrics = {
      sample:
        evaluation.sample,

      aggregate:
        evaluation.aggregate,

      boundaryForecasts: {
        first:
          firstForecast,

        last:
          lastForecast,
      },
    };

    const config = {
      model: {
        ...MODEL_DEFINITION,

        checksum:
          modelChecksum,
      },

      target:
        MODEL_DEFINITION.target,

      datasetChecksum:
        dataset.checksum,

      modelTimeframe:
        timeframe,

      lookbackBars,

      horizonBars,

      horizonMilliseconds:
        timeframeMs *
        horizonBars,

      incompletePolicy:
        INCOMPLETE_POLICY,

      evaluationWindow: {
        startAt:
          evaluationStartAt,

        endAt:
          evaluationEndAt,
      },

      informationAvailability:
        "CANDLE_CLOSE_EQUALS_CANDLE_TIMESTAMP_PLUS_TIMEFRAME",

      scoring: {
        volatility:
          "MAE_RMSE_MEDIAN_AE_BIAS",

        variance:
          "MAE_RMSE_BIAS",

        qlike:
          "ACTUAL_VARIANCE_OVER_FORECAST_VARIANCE_MINUS_LOG_RATIO_MINUS_ONE",

        varianceFloor:
          DEFAULT_VARIANCE_FLOOR,
      },
    };

    const analysisRun =
      await createAnalysisRun(
        {
          datasetId:
            dataset.id,

          runType:
            RUN_TYPE,

          engineVersion:
            ENGINE_VERSION,

          config,

          metrics,
        },
        options
      );

    return {
      analysisRunId:
        analysisRun.id,

      datasetId:
        dataset.id,

      runType:
        RUN_TYPE,

      engineVersion:
        ENGINE_VERSION,

      modelId:
        MODEL_DEFINITION.id,

      modelVersion:
        MODEL_DEFINITION.version,

      modelChecksum,

      config,

      metrics,
    };
  };

module.exports = {
  ENGINE_VERSION,
  RUN_TYPE,
  runHistoricalVolatilityWalkForward,
};