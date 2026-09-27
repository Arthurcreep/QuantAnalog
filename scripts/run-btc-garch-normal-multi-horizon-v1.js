const sequelize = require(
  "../src/config/database"
);

const {
  findDatasetById,
} = require(
  "../src/modules/datasets/repositories/dataset.repository"
);

const {
  timeframeToMilliseconds,
} = require(
  "../src/modules/datasets/calculations/timeframeToMilliseconds"
);

const {
  buildLogReturnSeries,
} = require(
  "../src/modules/research/series/buildLogReturnSeries"
);

const {
  evaluateHistoricalVolatilityBaseline,
} = require(
  "../src/modules/forecasting/walkForward/evaluateHistoricalVolatilityBaseline"
);

const {
  evaluateGarchNormalMultiHorizonV1,
} = require(
  "../src/modules/forecasting/walkForward/evaluateGarchNormalMultiHorizonV1"
);

const {
  MODEL_DEFINITION:
    BASELINE_MODEL_DEFINITION,
} = require(
  "../src/modules/forecasting/models/historicalVolatilityBaselineV1"
);

const {
  GARCH_NORMAL_MULTI_HORIZON_V1,
} = require(
  "../src/modules/forecasting/protocols/garchNormalMultiHorizonV1"
);

const {
  VOLATILITY_FORECAST_MULTI_HORIZON_COMPARISON_V1,
  resolveMultiHorizonComparisonConfig,
} = require(
  "../src/modules/forecasting/protocols/volatilityForecastMultiHorizonComparisonV1"
);

const {
  compareVolatilityForecastModels,
} = require(
  "../src/modules/forecasting/evaluation/compareVolatilityForecastModels"
);

const EVALUATION_START =
  "2025-01-01T00:00:00.000Z";

const EVALUATION_END =
  "2026-09-20T14:00:00.000Z";

const BASELINE_LOOKBACK_BARS =
  168;

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

const buildHorizonSummary = ({
  horizon,
  baseline,
  candidate,
  comparison,
  comparisonConfig,
}) => ({
  horizon:
    horizon.name,

  horizonBars:
    horizon.bars,

  evaluatedForecasts:
    candidate
      .sample
      .evaluatedForecasts,

  baseline: {
    mae:
      baseline
        .aggregate
        .volatility
        .mae,

    rmse:
      baseline
        .aggregate
        .volatility
        .rmse,

    meanQLIKE:
      baseline
        .aggregate
        .qlike
        .mean,
  },

  garch: {
    mae:
      candidate
        .aggregate
        .volatility
        .mae,

    rmse:
      candidate
        .aggregate
        .volatility
        .rmse,

    meanQLIKE:
      candidate
        .aggregate
        .qlike
        .mean,
  },

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
      comparison
        .absoluteError,

    squaredError:
      comparison
        .squaredError,

    qlike:
      comparison
        .qlike,
  },

  firstForecast:
    candidate.rows[0] ||
    null,

  lastForecast:
    candidate.rows[
      candidate.rows.length -
      1
    ] || null,
});

const buildTableRow = (
  summary
) => ({
  horizon:
    summary.horizon,

  N:
    summary
      .evaluatedForecasts,

  baselineQLIKE:
    summary
      .baseline
      .meanQLIKE,

  garchQLIKE:
    summary
      .garch
      .meanQLIKE,

  qlikeImprovementPct:
    summary
      .relativeImprovement
      .meanQLIKE ===
      null
      ? null
      : summary
          .relativeImprovement
          .meanQLIKE *
        100,

  garchWinRate:
    summary
      .comparison
      .qlike
      .wins
      .candidateWinRate,

  hacLag:
    summary
      .comparisonConfig
      .hacLag,

  hacP:
    summary
      .comparison
      .qlike
      .hac
      .pValueCandidateBetter,

  bootLower:
    summary
      .comparison
      .qlike
      .bootstrap
      .confidenceInterval
      .lower,

  bootUpper:
    summary
      .comparison
      .qlike
      .bootstrap
      .confidenceInterval
      .upper,

  bootSupportsGarch:
    summary
      .comparison
      .qlike
      .bootstrap
      .confidenceInterval
      .supportsCandidate,
});

const run = async () => {
  try {
    const datasetId =
      process.argv[2];

    if (!datasetId) {
      throw new Error(
        "DATASET_ID_REQUIRED"
      );
    }

    await sequelize.authenticate();

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
        `MULTI_HORIZON_TIMEFRAME_MISMATCH:${dataset.sourceTimeframe}`
      );
    }

    const expectedIntervalMs =
      timeframeToMilliseconds(
        dataset.sourceTimeframe
      );

    console.log(
      "Building BTC return series..."
    );

    const returns =
      await buildLogReturnSeries({
        filePath:
          dataset.storageUri,

        timeframe:
          dataset.sourceTimeframe,

        incompletePolicy:
          "DROP_INCOMPLETE",
      });

    const horizonBarsList =
      HORIZONS.map(
        (item) =>
          item.bars
      );

    console.log(
      "Running single-pass GARCH multi-horizon evaluation..."
    );

    const candidate =
      evaluateGarchNormalMultiHorizonV1({
        series:
          returns.series,

        horizonBarsList,

        expectedIntervalMs,

        evaluationStartAt:
          EVALUATION_START,

        evaluationEndAt:
          EVALUATION_END,
      });

    const summaries =
      [];

    for (
      const horizon of
        HORIZONS
    ) {
      console.log(
        `Running baseline and paired comparison: ${horizon.name}...`
      );

      const baseline =
        evaluateHistoricalVolatilityBaseline({
          series:
            returns.series,

          lookbackBars:
            BASELINE_LOOKBACK_BARS,

          horizonBars:
            horizon.bars,

          expectedIntervalMs,

          evaluationStartAt:
            EVALUATION_START,

          evaluationEndAt:
            EVALUATION_END,
        });

      const candidateHorizon =
        candidate
          .horizons[
            String(
              horizon.bars
            )
          ];

      if (
        !candidateHorizon
      ) {
        throw new Error(
          `CANDIDATE_HORIZON_MISSING:${horizon.bars}`
        );
      }

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

      summaries.push(
        buildHorizonSummary({
          horizon,

          baseline,

          candidate:
            candidateHorizon,

          comparison,

          comparisonConfig,
        })
      );
    }

    console.log(
      "\nBTC GARCH Normal Multi-Horizon V1 completed."
    );

    console.log(
      "\n===== PROTOCOL ====="
    );

    console.log({
      protocol:
        `${GARCH_NORMAL_MULTI_HORIZON_V1.id}@${GARCH_NORMAL_MULTI_HORIZON_V1.version}`,

      model:
        `${GARCH_NORMAL_MULTI_HORIZON_V1.modelId}@${GARCH_NORMAL_MULTI_HORIZON_V1.modelVersion}`,

      modelTimeframe:
        GARCH_NORMAL_MULTI_HORIZON_V1
          .modelTimeframe,

      horizons:
        HORIZONS,

      trainingWindowBars:
        GARCH_NORMAL_MULTI_HORIZON_V1
          .trainingWindowBars,

      refitEveryForecasts:
        GARCH_NORMAL_MULTI_HORIZON_V1
          .refitEveryForecasts,

      evaluationStartAt:
        EVALUATION_START,

      evaluationEndAt:
        EVALUATION_END,
    });

    console.log(
      "\n===== SINGLE-PASS DIAGNOSTICS ====="
    );

    console.log({
      modelCalls:
        candidate
          .sample
          .modelCalls,

      ...candidate
        .diagnostics,
    });

    console.log(
      "\n===== MULTI-HORIZON QLIKE SUMMARY ====="
    );

    console.table(
      summaries.map(
        buildTableRow
      )
    );

    for (
      const summary of
        summaries
    ) {
      console.log(
        `\n===== ${summary.horizon} =====`
      );

      console.dir(
        {
          horizonBars:
            summary
              .horizonBars,

          evaluatedForecasts:
            summary
              .evaluatedForecasts,

          baseline:
            summary.baseline,

          garch:
            summary.garch,

          relativeImprovement:
            summary
              .relativeImprovement,

          comparisonConfig:
            summary
              .comparisonConfig,

          absoluteErrorComparison:
            summary
              .comparison
              .absoluteError,

          squaredErrorComparison:
            summary
              .comparison
              .squaredError,

          qlikeComparison:
            summary
              .comparison
              .qlike,

          firstForecast:
            summary
              .firstForecast,

          lastForecast:
            summary
              .lastForecast,
        },
        {
          depth:
            null,
        }
      );
    }
  } catch (error) {
    console.error(
      "BTC GARCH Normal Multi-Horizon V1 failed:",
      error
    );

    process.exitCode =
      1;
  } finally {
    await sequelize.close();
  }
};

run();