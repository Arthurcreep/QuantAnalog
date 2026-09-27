const assert = require(
  "assert"
);

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
  evaluateGarchNormalV1,
} = require(
  "../src/modules/forecasting/walkForward/evaluateGarchNormalV1"
);

const {
  GARCH_NORMAL_V1,
} = require(
  "../src/modules/forecasting/protocols/garchNormalV1"
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
  meanDifference:
    result
      .observedMeanDifference,

  interpretation:
    result
      .interpretation,

  candidateWinRate:
    result
      .wins
      .candidateWinRate,

  candidateWins:
    result
      .wins
      .candidateWins,

  baselineWins:
    result
      .wins
      .baselineWins,

  ties:
    result
      .wins
      .ties,

  hac: {
    lag:
      result
        .hac
        .hacLag,

    standardError:
      result
        .hac
        .standardError,

    statistic:
      result
        .hac
        .statistic,

    pValueTwoSided:
      result
        .hac
        .pValueTwoSided,

    pValueCandidateBetter:
      result
        .hac
        .pValueCandidateBetter,
  },

  bootstrap: {
    blockSize:
      result
        .bootstrap
        .config
        .blockSize,

    iterations:
      result
        .bootstrap
        .config
        .iterations,

    seed:
      result
        .bootstrap
        .config
        .seed,

    validBlockStartCount:
      result
        .bootstrap
        .config
        .validBlockStartCount,

    observedMean:
      result
        .bootstrap
        .observed
        .mean,

    confidenceInterval:
      result
        .bootstrap
        .confidenceInterval,

    probabilityPositive:
      result
        .bootstrap
        .probabilityPositive,
  },
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
        dataset
          .sourceTimeframe
      );

    const returns =
      await buildLogReturnSeries({
        filePath:
          dataset.storageUri,

        timeframe:
          dataset
            .sourceTimeframe,

        incompletePolicy:
          "DROP_INCOMPLETE",
      });

    console.log(
      "Running baseline..."
    );

    const baseline =
      evaluateHistoricalVolatilityBaseline({
        series:
          returns.series,

        lookbackBars:
          BASELINE_LOOKBACK_BARS,

        horizonBars:
          1,

        expectedIntervalMs:
          timeframeMs,

        evaluationStartAt:
          EVALUATION_START,

        evaluationEndAt:
          EVALUATION_END,
      });

    console.log(
      "Running GARCH_NORMAL_V1..."
    );

    const garch =
      evaluateGarchNormalV1({
        series:
          returns.series,

        expectedIntervalMs:
          timeframeMs,

        evaluationStartAt:
          EVALUATION_START,

        evaluationEndAt:
          EVALUATION_END,
      });

    /*
     * Comparability is mandatory.
     */

    assert.strictEqual(
      garch
        .sample
        .evaluatedForecasts,
      baseline
        .sample
        .evaluatedForecasts,
      "GARCH_AND_BASELINE_FORECAST_COUNTS_DIFFER"
    );

    assert.strictEqual(
      garch.rows.length,
      baseline.rows.length
    );

    for (
      let index = 0;
      index <
        baseline.rows.length;
      index += 1
    ) {
      const baselineRow =
        baseline.rows[
          index
        ];

      const garchRow =
        garch.rows[
          index
        ];

      assert.strictEqual(
        garchRow.issuedAt,
        baselineRow.issuedAt,
        `ISSUE_TIME_MISMATCH_AT_${index}`
      );

      assert.strictEqual(
        garchRow
          .targetStartTimestamp,
        baselineRow
          .targetStartTimestamp,
        `TARGET_START_MISMATCH_AT_${index}`
      );

      assert.strictEqual(
        garchRow
          .targetEndTimestamp,
        baselineRow
          .targetEndTimestamp,
        `TARGET_END_MISMATCH_AT_${index}`
      );

      assert.strictEqual(
        garchRow
          .actualVariance,
        baselineRow
          .actualVariance,
        `ACTUAL_VARIANCE_MISMATCH_AT_${index}`
      );
    }

    const baselineMetrics = {
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

      bias:
        baseline
          .aggregate
          .volatility
          .bias,

      meanQLIKE:
        baseline
          .aggregate
          .qlike
          .mean,

      medianQLIKE:
        baseline
          .aggregate
          .qlike
          .median,
    };

    const garchMetrics = {
      mae:
        garch
          .aggregate
          .volatility
          .mae,

      rmse:
        garch
          .aggregate
          .volatility
          .rmse,

      bias:
        garch
          .aggregate
          .volatility
          .bias,

      meanQLIKE:
        garch
          .aggregate
          .qlike
          .mean,

      medianQLIKE:
        garch
          .aggregate
          .qlike
          .median,
    };

    const relativeChange = {
      maeImprovement:
        calculateRelativeImprovement({
          baseline:
            baselineMetrics.mae,

          candidate:
            garchMetrics.mae,
        }),

      rmseImprovement:
        calculateRelativeImprovement({
          baseline:
            baselineMetrics.rmse,

          candidate:
            garchMetrics.rmse,
        }),

      meanQLIKEImprovement:
        calculateRelativeImprovement({
          baseline:
            baselineMetrics
              .meanQLIKE,

          candidate:
            garchMetrics
              .meanQLIKE,
        }),

      medianQLIKEImprovement:
        calculateRelativeImprovement({
          baseline:
            baselineMetrics
              .medianQLIKE,

          candidate:
            garchMetrics
              .medianQLIKE,
        }),
    };

    console.log(
      "Running paired forecast comparison..."
    );

    const comparison =
      compareVolatilityForecastModels({
        baselineRows:
          baseline.rows,

        candidateRows:
          garch.rows,

        expectedIntervalMs:
          timeframeMs,

        baselineModel:
          "HISTORICAL_VOLATILITY_BASELINE@1.0.0",

        candidateModel:
          "GARCH_NORMAL@1.0.0",
      });

    console.log(
      "\nBTC GARCH Normal V1 walk-forward completed."
    );

    console.log(
      "\n===== PROTOCOL ====="
    );

    console.log({
      protocol:
        `${GARCH_NORMAL_V1.id}@${GARCH_NORMAL_V1.version}`,

      timeframe:
        GARCH_NORMAL_V1
          .modelTimeframe,

      horizonBars:
        GARCH_NORMAL_V1
          .horizonBars,

      trainingWindowBars:
        GARCH_NORMAL_V1
          .trainingWindowBars,

      refitEveryForecasts:
        GARCH_NORMAL_V1
          .refitEveryForecasts,

      distribution:
        GARCH_NORMAL_V1
          .distribution,

      evaluationStartAt:
        EVALUATION_START,

      evaluationEndAt:
        EVALUATION_END,
    });

    console.log(
      "\n===== SAMPLE ====="
    );

    console.log({
      baseline:
        baseline.sample,

      garch:
        garch.sample,
    });

    console.log(
      "\n===== REFIT DIAGNOSTICS ====="
    );

    console.log({
      refitCount:
        garch
          .diagnostics
          .refitCount,

      recursiveForecastCount:
        garch
          .diagnostics
          .recursiveForecastCount,

      nonConvergedRefitCount:
        garch
          .diagnostics
          .nonConvergedRefitCount,

      totalForecasts:
        garch
          .diagnostics
          .totalForecasts,
    });

    console.log(
      "\n===== BASELINE ====="
    );

    console.log(
      baselineMetrics
    );

    console.log(
      "\n===== GARCH ====="
    );

    console.log(
      garchMetrics
    );

    console.log(
      "\n===== RELATIVE CHANGE ====="
    );

    console.log(
      relativeChange
    );

    console.log(
      "\n===== PAIRED COMPARISON PROTOCOL ====="
    );

    console.log({
      protocol:
        `${comparison.protocol.id}@${comparison.protocol.version}`,

      sampleSize:
        comparison.sampleSize,

      lossDifferential:
        comparison
          .lossDifferential,

      interpretation:
        comparison
          .interpretation,

      evidenceUse:
        comparison
          .protocol
          .evidenceUse,
    });

    console.log(
      "\n===== ABSOLUTE ERROR COMPARISON ====="
    );

    console.dir(
      summarizeComparisonLoss(
        comparison
          .absoluteError
      ),
      {
        depth:
          null,
      }
    );

    console.log(
      "\n===== SQUARED ERROR COMPARISON ====="
    );

    console.dir(
      summarizeComparisonLoss(
        comparison
          .squaredError
      ),
      {
        depth:
          null,
      }
    );

    console.log(
      "\n===== QLIKE COMPARISON ====="
    );

    console.dir(
      summarizeComparisonLoss(
        comparison.qlike
      ),
      {
        depth:
          null,
      }
    );

    console.log(
      "\n===== FIRST GARCH FORECAST ====="
    );

    console.log(
      garch.rows[0]
    );

    console.log(
      "\n===== LAST GARCH FORECAST ====="
    );

    console.log(
      garch.rows[
        garch.rows.length -
        1
      ]
    );

    console.log(
      "\n===== FIRST FIT ====="
    );

    console.dir(
      garch
        .diagnostics
        .firstFit,
      {
        depth:
          null,
      }
    );

    console.log(
      "\n===== LAST FIT ====="
    );

    console.dir(
      garch
        .diagnostics
        .lastFit,
      {
        depth:
          null,
      }
    );
  } catch (error) {
    console.error(
      "BTC GARCH Normal V1 walk-forward failed:",
      error
    );

    process.exitCode =
      1;
  } finally {
    await sequelize.close();
  }
};

run();