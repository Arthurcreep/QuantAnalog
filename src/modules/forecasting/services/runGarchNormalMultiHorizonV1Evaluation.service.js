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
  evaluateHistoricalVolatilityBaseline,
} = require(
  "../walkForward/evaluateHistoricalVolatilityBaseline"
);

const {
  evaluateGarchNormalMultiHorizonV1,
} = require(
  "../walkForward/evaluateGarchNormalMultiHorizonV1"
);

const {
  MODEL_DEFINITION:
    BASELINE_MODEL_DEFINITION,
} = require(
  "../models/historicalVolatilityBaselineV1"
);

const {
  GARCH_NORMAL_MULTI_HORIZON_V1,
} = require(
  "../protocols/garchNormalMultiHorizonV1"
);

const {
  VOLATILITY_FORECAST_MULTI_HORIZON_COMPARISON_V1,
  resolveMultiHorizonComparisonConfig,
} = require(
  "../protocols/volatilityForecastMultiHorizonComparisonV1"
);

const {
  compareVolatilityForecastModels,
} = require(
  "../evaluation/compareVolatilityForecastModels"
);

const {
  calculateObjectChecksum,
} = require(
  "../../../shared/hash/calculateObjectChecksum"
);

const ENGINE_VERSION =
  "garch-normal-multi-horizon-v1-evaluation-v1.0";

const RUN_TYPE =
  "FORECAST_WALK_FORWARD";

const BASELINE_LOOKBACK_BARS =
  168;

const INCOMPLETE_POLICY =
  "DROP_INCOMPLETE";

const HORIZONS =
  Object.freeze([
    {
      name:
        "1h",

      bars:
        1,
    },

    {
      name:
        "6h",

      bars:
        6,
    },

    {
      name:
        "1d",

      bars:
        24,
    },

    {
      name:
        "3d",

      bars:
        72,
    },

    {
      name:
        "5d",

      bars:
        120,
    },
  ]);

const calculateRelativeImprovement =
  ({
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

const summarizeLoss = (
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

const buildHorizonResult = ({
  horizon,
  baseline,
  candidate,
  comparison,
  comparisonConfig,
}) => ({
  name:
    horizon.name,

  horizonBars:
    horizon.bars,

  sample: {
    baseline:
      baseline.sample,

    candidate:
      candidate.sample,
  },

  baseline:
    baseline.aggregate,

  candidate:
    candidate.aggregate,

  relativeImprovement: {
    mae:
      calculateRelativeImprovement({
        baseline:
          baseline
            .aggregate
            .volatility
            .mae,

        candidate:
          candidate
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
          candidate
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
          candidate
            .aggregate
            .qlike
            .mean,
      }),
  },

  comparisonConfig,

  comparison: {
    absoluteError:
      summarizeLoss(
        comparison
          .absoluteError
      ),

    squaredError:
      summarizeLoss(
        comparison
          .squaredError
      ),

    qlike:
      summarizeLoss(
        comparison.qlike
      ),
  },

  boundaryForecasts: {
    first:
      candidate.rows[0] ||
      null,

    last:
      candidate.rows[
        candidate.rows.length -
        1
      ] || null,
  },
});

const runGarchNormalMultiHorizonV1Evaluation =
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
      throw new Error(
        "FORECAST_DATASET_NOT_FOUND"
      );
    }

    if (
      dataset.stage !==
      "PREPARED"
    ) {
      throw new Error(
        "MULTI_HORIZON_REQUIRES_PREPARED_DATASET"
      );
    }

    if (
      dataset.sourceTimeframe !==
      GARCH_NORMAL_MULTI_HORIZON_V1
        .modelTimeframe
    ) {
      throw new Error(
        "MULTI_HORIZON_MODEL_TIMEFRAME_MISMATCH"
      );
    }

    const expectedIntervalMs =
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

    const candidate =
      evaluateGarchNormalMultiHorizonV1({
        series:
          returns.series,

        horizonBarsList:
          HORIZONS.map(
            (item) =>
              item.bars
          ),

        expectedIntervalMs,

        evaluationStartAt,

        evaluationEndAt,
      });

    const horizons =
      {};

    for (
      const horizon of
        HORIZONS
    ) {
      const baseline =
        evaluateHistoricalVolatilityBaseline({
          series:
            returns.series,

          lookbackBars:
            BASELINE_LOOKBACK_BARS,

          horizonBars:
            horizon.bars,

          expectedIntervalMs,

          evaluationStartAt,

          evaluationEndAt,
        });

      const candidateHorizon =
        candidate
          .horizons[
            String(
              horizon.bars
            )
          ];

      const comparisonConfig =
        resolveMultiHorizonComparisonConfig({
          horizonBars:
            horizon.bars,
        });

      const comparison =
        compareVolatilityForecastModels({
          baselineRows:
            baseline.rows,

          candidateRows:
            candidateHorizon
              .rows,

          expectedIntervalMs,

          baselineModel:
            `${BASELINE_MODEL_DEFINITION.id}@${BASELINE_MODEL_DEFINITION.version}`,

          candidateModel:
            `${GARCH_NORMAL_MULTI_HORIZON_V1.modelId}@${GARCH_NORMAL_MULTI_HORIZON_V1.modelVersion}`,

          comparisonConfig,

          comparisonProtocol:
            VOLATILITY_FORECAST_MULTI_HORIZON_COMPARISON_V1,
        });

      horizons[
        horizon.name
      ] =
        buildHorizonResult({
          horizon,

          baseline,

          candidate:
            candidateHorizon,

          comparison,

          comparisonConfig,
        });
    }

    const protocolChecksum =
      calculateObjectChecksum(
        GARCH_NORMAL_MULTI_HORIZON_V1
      );

    const baselineChecksum =
      calculateObjectChecksum(
        BASELINE_MODEL_DEFINITION
      );

    const comparisonChecksum =
      calculateObjectChecksum(
        VOLATILITY_FORECAST_MULTI_HORIZON_COMPARISON_V1
      );

    const config = {
      mode:
        "MULTI_HORIZON",

      datasetChecksum:
        dataset.checksum,

      modelTimeframe:
        dataset.sourceTimeframe,

      horizons:
        HORIZONS,

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
          GARCH_NORMAL_MULTI_HORIZON_V1,

        protocolChecksum,
      },

      baseline: {
        model:
          BASELINE_MODEL_DEFINITION,

        modelChecksum:
          baselineChecksum,

        lookbackBars:
          BASELINE_LOOKBACK_BARS,
      },

      comparison: {
        protocol:
          VOLATILITY_FORECAST_MULTI_HORIZON_COMPARISON_V1,

        protocolChecksum:
          comparisonChecksum,
      },
    };

    const metrics = {
      singlePass: {
        modelCalls:
          candidate
            .sample
            .modelCalls,

        diagnostics:
          candidate
            .diagnostics,
      },

      horizons,
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

      engineVersion:
        ENGINE_VERSION,

      model:
        `${GARCH_NORMAL_MULTI_HORIZON_V1.modelId}@${GARCH_NORMAL_MULTI_HORIZON_V1.modelVersion}`,

      protocol:
        `${GARCH_NORMAL_MULTI_HORIZON_V1.id}@${GARCH_NORMAL_MULTI_HORIZON_V1.version}`,

      protocolChecksum,

      comparisonChecksum,

      metrics,
    };
  };

module.exports = {
  ENGINE_VERSION,
  RUN_TYPE,
  HORIZONS,
  runGarchNormalMultiHorizonV1Evaluation,
};