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
  MODEL_DEFINITION:
    BASELINE_MODEL_DEFINITION,
} = require(
  "../models/historicalVolatilityBaselineV1"
);

const {
  evaluateHistoricalVolatilityBaseline,
} = require(
  "../walkForward/evaluateHistoricalVolatilityBaseline"
);

const {
  evaluateGarchNormalV1,
} = require(
  "../walkForward/evaluateGarchNormalV1"
);

const {
  GARCH_NORMAL_V1,
} = require(
  "../protocols/garchNormalV1"
);

const {
  VOLATILITY_FORECAST_COMPARISON_V1,
} = require(
  "../protocols/volatilityForecastComparisonV1"
);

const {
  compareVolatilityForecastModels,
} = require(
  "../evaluation/compareVolatilityForecastModels"
);

const {
  auditGarchWalkForward,
} = require(
  "../evaluation/auditGarchWalkForward"
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
  "garch-normal-v1-evaluation-v1.0";

const RUN_TYPE =
  "FORECAST_WALK_FORWARD";

const INCOMPLETE_POLICY =
  "DROP_INCOMPLETE";

const BASELINE_LOOKBACK_BARS =
  168;

const calculateRelativeImprovement = ({
  baseline,
  candidate,
}) => {
  if (
    !Number.isFinite(
      baseline
    ) ||
    !Number.isFinite(
      candidate
    ) ||
    baseline === 0
  ) {
    return null;
  }

  return (
    baseline -
    candidate
  ) /
    baseline;
};

const summarizeComparisonLoss = (
  result
) => ({
  observedMeanDifference:
    result
      .observedMeanDifference,

  interpretation:
    result
      .interpretation,

  wins:
    result.wins,

  hac:
    result.hac,

  bootstrap:
    result.bootstrap,
});

const runGarchNormalV1Evaluation =
  async ({
    datasetId,
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
        "PREPARED" ||
      dataset.sourceTimeframe !==
        GARCH_NORMAL_V1
          .modelTimeframe
    ) {
      throw new Error(
        "GARCH_V1_REQUIRES_PREPARED_1H_DATASET"
      );
    }

    const timeframeMs =
      timeframeToMilliseconds(
        dataset.sourceTimeframe
      );

    const returns =
      await buildLogReturnSeries({
        filePath:
          dataset.storageUri,

        timeframe:
          dataset.sourceTimeframe,

        incompletePolicy:
          INCOMPLETE_POLICY,
      });

    const baseline =
      evaluateHistoricalVolatilityBaseline({
        series:
          returns.series,

        lookbackBars:
          BASELINE_LOOKBACK_BARS,

        horizonBars:
          GARCH_NORMAL_V1
            .horizonBars,

        expectedIntervalMs:
          timeframeMs,

        evaluationStartAt,

        evaluationEndAt,
      });

    const garch =
      evaluateGarchNormalV1({
        series:
          returns.series,

        expectedIntervalMs:
          timeframeMs,

        evaluationStartAt,

        evaluationEndAt,
      });

    const comparison =
      compareVolatilityForecastModels({
        baselineRows:
          baseline.rows,

        candidateRows:
          garch.rows,

        expectedIntervalMs:
          timeframeMs,

        baselineModel:
          `${BASELINE_MODEL_DEFINITION.id}@${BASELINE_MODEL_DEFINITION.version}`,

        candidateModel:
          `${GARCH_NORMAL_V1.modelId}@${GARCH_NORMAL_V1.modelVersion}`,
      });

    const audit =
      auditGarchWalkForward({
        baselineRows:
          baseline.rows,

        garchRows:
          garch.rows,

        diagnostics:
          garch.diagnostics,

        persistenceMaximum:
          GARCH_NORMAL_V1
            .constraints
            .persistenceMaximum,

        maxIterations:
          GARCH_NORMAL_V1
            .optimization
            .maxIterations,
      });

    const garchProtocolChecksum =
      calculateObjectChecksum(
        GARCH_NORMAL_V1
      );

    const baselineModelChecksum =
      calculateObjectChecksum(
        BASELINE_MODEL_DEFINITION
      );

    const comparisonProtocolChecksum =
      calculateObjectChecksum(
        VOLATILITY_FORECAST_COMPARISON_V1
      );

    const relativeImprovement = {
      mae:
        calculateRelativeImprovement({
          baseline:
            baseline
              .aggregate
              .volatility
              .mae,

          candidate:
            garch
              .aggregate
              .volatility
              .mae,
        }),

      rmse:
        calculateRelativeImprovement({
          baseline:
            baseline
              .aggregate
              .volatility
              .rmse,

          candidate:
            garch
              .aggregate
              .volatility
              .rmse,
        }),

      meanQLIKE:
        calculateRelativeImprovement({
          baseline:
            baseline
              .aggregate
              .qlike
              .mean,

          candidate:
            garch
              .aggregate
              .qlike
              .mean,
        }),
    };

    const config = {
      datasetChecksum:
        dataset.checksum,

      modelTimeframe:
        dataset.sourceTimeframe,

      horizonBars:
        GARCH_NORMAL_V1
          .horizonBars,

      evaluationWindow: {
        startAt:
          evaluationStartAt,

        endAt:
          evaluationEndAt,
      },

      incompletePolicy:
        INCOMPLETE_POLICY,

      candidate: {
        protocol:
          GARCH_NORMAL_V1,

        protocolChecksum:
          garchProtocolChecksum,
      },

      baseline: {
        model:
          BASELINE_MODEL_DEFINITION,

        modelChecksum:
          baselineModelChecksum,

        lookbackBars:
          BASELINE_LOOKBACK_BARS,
      },

      comparison: {
        protocol:
          VOLATILITY_FORECAST_COMPARISON_V1,

        protocolChecksum:
          comparisonProtocolChecksum,
      },
    };

    const metrics = {
      sample: {
        baseline:
          baseline.sample,

        candidate:
          garch.sample,
      },

      baseline:
        baseline.aggregate,

      candidate:
        garch.aggregate,

      relativeImprovement,

      comparison: {
        absoluteError:
          summarizeComparisonLoss(
            comparison.absoluteError
          ),

        squaredError:
          summarizeComparisonLoss(
            comparison.squaredError
          ),

        qlike:
          summarizeComparisonLoss(
            comparison.qlike
          ),
      },

      audit: {
        fitCount:
          audit.fitCount,

        convergence:
          audit.convergence,

        persistence:
          audit.persistence,

        iterations:
          audit.iterations,

        likelihoodImprovement:
          audit
            .likelihoodImprovement,

        forecastExposure:
          audit.forecastExposure,

        lossByFitConvergence:
          audit
            .lossByFitConvergence,
      },

      boundaryForecasts: {
        first:
          garch.rows[0] ||
          null,

        last:
          garch.rows[
            garch.rows.length -
            1
          ] || null,
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

      model:
        `${GARCH_NORMAL_V1.modelId}@${GARCH_NORMAL_V1.modelVersion}`,

      protocol:
        `${GARCH_NORMAL_V1.id}@${GARCH_NORMAL_V1.version}`,

      garchProtocolChecksum,

      comparisonProtocolChecksum,

      config,

      metrics,
    };
  };

module.exports = {
  ENGINE_VERSION,
  RUN_TYPE,
  runGarchNormalV1Evaluation,
};