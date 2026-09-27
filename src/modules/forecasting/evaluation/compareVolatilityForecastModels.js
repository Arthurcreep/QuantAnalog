const {
  calculateHacMeanTest,
} = require(
  "./calculateHacMeanTest"
);

const {
  calculateMovingBlockMeanBootstrap,
} = require(
  "./calculateMovingBlockMeanBootstrap"
);

const {
  VOLATILITY_FORECAST_COMPARISON_V1,
} = require(
  "../protocols/volatilityForecastComparisonV1"
);

const validatePairedRows = ({
  baselineRows,
  candidateRows,
}) => {
  if (
    !Array.isArray(
      baselineRows
    ) ||
    !Array.isArray(
      candidateRows
    ) ||
    baselineRows.length === 0 ||
    baselineRows.length !==
      candidateRows.length
  ) {
    throw new Error(
      "INVALID_FORECAST_COMPARISON_ROWS"
    );
  }

  for (
    let index = 0;
    index <
      baselineRows.length;
    index += 1
  ) {
    const baseline =
      baselineRows[index];

    const candidate =
      candidateRows[index];

    if (
      baseline.issuedAt !==
      candidate.issuedAt
    ) {
      throw new Error(
        `FORECAST_COMPARISON_ISSUE_MISMATCH:${index}`
      );
    }

    if (
      baseline
        .targetStartTimestamp !==
      candidate
        .targetStartTimestamp
    ) {
      throw new Error(
        `FORECAST_COMPARISON_TARGET_START_MISMATCH:${index}`
      );
    }

    if (
      baseline
        .targetEndTimestamp !==
      candidate
        .targetEndTimestamp
    ) {
      throw new Error(
        `FORECAST_COMPARISON_TARGET_END_MISMATCH:${index}`
      );
    }

    if (
      baseline
        .actualVariance !==
      candidate
        .actualVariance
    ) {
      throw new Error(
        `FORECAST_COMPARISON_ACTUAL_MISMATCH:${index}`
      );
    }
  }
};

const calculateWinSummary = (
  differences
) => {
  let candidateWins =
    0;

  let baselineWins =
    0;

  let ties =
    0;

  for (
    const value of
      differences
  ) {
    if (
      value > 0
    ) {
      candidateWins +=
        1;
    } else if (
      value < 0
    ) {
      baselineWins +=
        1;
    } else {
      ties +=
        1;
    }
  }

  return {
    candidateWins,

    baselineWins,

    ties,

    candidateWinRate:
      candidateWins /
      differences.length,

    baselineWinRate:
      baselineWins /
      differences.length,
  };
};

const buildDefaultComparisonConfig =
  () => ({
    hacLag:
      VOLATILITY_FORECAST_COMPARISON_V1
        .hac
        .lag,

    blockSize:
      VOLATILITY_FORECAST_COMPARISON_V1
        .bootstrap
        .blockSizeBars,

    iterations:
      VOLATILITY_FORECAST_COMPARISON_V1
        .bootstrap
        .iterations,

    seed:
      VOLATILITY_FORECAST_COMPARISON_V1
        .bootstrap
        .seed,

    confidenceLevel:
      VOLATILITY_FORECAST_COMPARISON_V1
        .bootstrap
        .confidenceLevel,
  });

const validateComparisonConfig = (
  config
) => {
  if (
    !config ||
    typeof config !==
      "object" ||
    Array.isArray(
      config
    )
  ) {
    throw new Error(
      "INVALID_FORECAST_COMPARISON_CONFIG"
    );
  }

  if (
    !Number.isInteger(
      config.hacLag
    ) ||
    config.hacLag < 0
  ) {
    throw new Error(
      "INVALID_FORECAST_COMPARISON_HAC_LAG"
    );
  }

  if (
    !Number.isInteger(
      config.blockSize
    ) ||
    config.blockSize <= 0
  ) {
    throw new Error(
      "INVALID_FORECAST_COMPARISON_BLOCK_SIZE"
    );
  }

  if (
    !Number.isInteger(
      config.iterations
    ) ||
    config.iterations <= 0
  ) {
    throw new Error(
      "INVALID_FORECAST_COMPARISON_ITERATIONS"
    );
  }

  if (
    !Number.isInteger(
      config.seed
    )
  ) {
    throw new Error(
      "INVALID_FORECAST_COMPARISON_SEED"
    );
  }

  if (
    !Number.isFinite(
      config.confidenceLevel
    ) ||
    config.confidenceLevel <=
      0 ||
    config.confidenceLevel >=
      1
  ) {
    throw new Error(
      "INVALID_FORECAST_COMPARISON_CONFIDENCE_LEVEL"
    );
  }
};

const evaluateLoss = ({
  rows,
  field,
  expectedIntervalMs,
  comparisonConfig,
  seedOffset,
}) => {
  const differences =
    rows.map(
      (row) =>
        row[field]
    );

  const hac =
    calculateHacMeanTest({
      values:
        differences,

      hacLag:
        comparisonConfig
          .hacLag,
    });

  const bootstrap =
    calculateMovingBlockMeanBootstrap({
      rows,

      valueField:
        field,

      expectedIntervalMs,

      blockSize:
        comparisonConfig
          .blockSize,

      iterations:
        comparisonConfig
          .iterations,

      seed:
        comparisonConfig
          .seed +
        seedOffset,

      confidenceLevel:
        comparisonConfig
          .confidenceLevel,
    });

  return {
    observedMeanDifference:
      hac.meanDifference,

    interpretation:
      hac.meanDifference > 0
        ? "CANDIDATE_LOWER_LOSS"
        : hac.meanDifference < 0
          ? "BASELINE_LOWER_LOSS"
          : "NO_MEAN_DIFFERENCE",

    wins:
      calculateWinSummary(
        differences
      ),

    hac,

    bootstrap,
  };
};

const compareVolatilityForecastModels =
  ({
    baselineRows,
    candidateRows,
    expectedIntervalMs,
    baselineModel,
    candidateModel,
    comparisonConfig = null,
    comparisonProtocol =
      VOLATILITY_FORECAST_COMPARISON_V1,
  }) => {
    validatePairedRows({
      baselineRows,
      candidateRows,
    });

    if (
      !Number.isFinite(
        expectedIntervalMs
      ) ||
      expectedIntervalMs <= 0
    ) {
      throw new Error(
        "INVALID_FORECAST_COMPARISON_INTERVAL"
      );
    }

    if (
      !comparisonProtocol ||
      typeof comparisonProtocol !==
        "object" ||
      typeof comparisonProtocol.id !==
        "string" ||
      typeof comparisonProtocol.version !==
        "string"
    ) {
      throw new Error(
        "INVALID_FORECAST_COMPARISON_PROTOCOL"
      );
    }

    const resolvedConfig =
      comparisonConfig ||
      buildDefaultComparisonConfig();

    validateComparisonConfig(
      resolvedConfig
    );

    const rows =
      baselineRows.map(
        (
          baseline,
          index
        ) => {
          const candidate =
            candidateRows[index];

          return {
            timestamp:
              baseline.issuedAt,

            issuedAt:
              baseline.issuedAt,

            absoluteErrorDifference:
              baseline
                .absoluteError -
              candidate
                .absoluteError,

            squaredErrorDifference:
              baseline
                .squaredError -
              candidate
                .squaredError,

            qlikeDifference:
              baseline.qlike -
              candidate.qlike,
          };
        }
      );

    return {
      protocol: {
        id:
          comparisonProtocol.id,

        version:
          comparisonProtocol.version,

        evidenceUse:
          comparisonProtocol
            .evidenceUse,
      },

      baselineModel,

      candidateModel,

      sampleSize:
        rows.length,

      lossDifferential:
        comparisonProtocol
          .lossDifferential,

      interpretation:
        comparisonProtocol
          .interpretation,

      absoluteError:
        evaluateLoss({
          rows,

          field:
            "absoluteErrorDifference",

          expectedIntervalMs,

          comparisonConfig:
            resolvedConfig,

          seedOffset:
            1,
        }),

      squaredError:
        evaluateLoss({
          rows,

          field:
            "squaredErrorDifference",

          expectedIntervalMs,

          comparisonConfig:
            resolvedConfig,

          seedOffset:
            2,
        }),

      qlike:
        evaluateLoss({
          rows,

          field:
            "qlikeDifference",

          expectedIntervalMs,

          comparisonConfig:
            resolvedConfig,

          seedOffset:
            3,
        }),
    };
  };

module.exports = {
  compareVolatilityForecastModels,
};