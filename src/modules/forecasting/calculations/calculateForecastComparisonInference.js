const {
  calculateHacMeanTest,
} = require(
  "../../../shared/statistics/calculateHacMeanTest"
);

const {
  calculateMovingBlockMeanBootstrap,
} = require(
  "../../../shared/statistics/calculateMovingBlockMeanBootstrap"
);

const ONE_HOUR_MS =
  60 *
  60 *
  1000;

const DEFAULT_BLOCK_SIZE =
  7;

const DEFAULT_ITERATIONS =
  2000;

const DEFAULT_CONFIDENCE_LEVEL =
  0.95;

const DEFAULT_SEED =
  20260927;

const parseHorizonMs = (
  horizon
) => {
  const match =
    /^(\d+)(m|h|d)$/.exec(
      horizon
    );

  if (!match) {
    throw new Error(
      `INVALID_INFERENCE_HORIZON:${horizon}`
    );
  }

  const value =
    Number(
      match[1]
    );

  const unit =
    match[2];

  if (
    unit === "m"
  ) {
    return (
      value *
      60 *
      1000
    );
  }

  if (
    unit === "h"
  ) {
    return (
      value *
      ONE_HOUR_MS
    );
  }

  return (
    value *
    24 *
    ONE_HOUR_MS
  );
};

const inferIssueIntervalMs = (
  pairs
) => {
  if (
    !Array.isArray(
      pairs
    ) ||
    pairs.length < 2
  ) {
    throw new Error(
      "INSUFFICIENT_ISSUE_INTERVAL_SAMPLE"
    );
  }

  let minimumIntervalMs =
    Infinity;

  for (
    let index = 1;
    index <
      pairs.length;
    index += 1
  ) {
    const previous =
      new Date(
        pairs[
          index - 1
        ].issuedAt
      ).getTime();

    const current =
      new Date(
        pairs[index]
          .issuedAt
      ).getTime();

    const interval =
      current -
      previous;

    if (
      !Number.isFinite(
        interval
      ) ||
      interval <= 0
    ) {
      throw new Error(
        "INVALID_FORECAST_ISSUE_INTERVAL"
      );
    }

    minimumIntervalMs =
      Math.min(
        minimumIntervalMs,
        interval
      );
  }

  return minimumIntervalMs;
};

const resolveHacLag = ({
  horizon,
  issueIntervalMs,
}) => {
  const horizonMs =
    parseHorizonMs(
      horizon
    );

  const horizonIssueSteps =
    Math.ceil(
      horizonMs /
      issueIntervalMs
    );

  const overlapLag =
    Math.max(
      0,
      horizonIssueSteps -
      1
    );

  return Math.max(
    1,
    overlapLag
  );
};

const buildMetricRows = ({
  pairs,
  field,
}) =>
  pairs.map(
    (pair) => {
      const value =
        Number(
          pair[field]
        );

      if (
        !Number.isFinite(
          value
        )
      ) {
        throw new Error(
          `INVALID_FORECAST_INFERENCE_FIELD:${field}`
        );
      }

      return {
        issuedAt:
          pair.issuedAt,

        value,
      };
    }
  );

const evaluateMetric = ({
  pairs,
  field,
  hacLag,
  issueIntervalMs,
  blockSize,
  iterations,
  confidenceLevel,
  seed,
}) => {
  const rows =
    buildMetricRows({
      pairs,

      field,
    });

  const values =
    rows.map(
      (row) =>
        row.value
    );

  const hac =
    calculateHacMeanTest({
      values,

      hacLag,
    });

  const bootstrap =
    calculateMovingBlockMeanBootstrap({
      rows,

      valueField:
        "value",

      timestampField:
        "issuedAt",

      expectedIntervalMs:
        issueIntervalMs,

      blockSize,

      iterations,

      seed,

      confidenceLevel,
    });

  let supportStatus =
    "INCONCLUSIVE";

  if (
    hac
      .pValueCandidateBetter <
      0.05 &&
    bootstrap
      .confidenceInterval
      .supportsCandidate
  ) {
    supportStatus =
      "CANDIDATE_SUPPORTED";
  } else if (
    hac
      .pValueBenchmarkBetter <
      0.05 &&
    bootstrap
      .confidenceInterval
      .supportsBenchmark
  ) {
    supportStatus =
      "BENCHMARK_SUPPORTED";
  }

  return {
    observedMeanAdvantage:
      hac.meanDifference,

    interpretation:
      hac.direction,

    hac,

    bootstrap,

    supportStatus,
  };
};

const calculateForecastComparisonInference =
  ({
    comparison,
    blockSize =
      DEFAULT_BLOCK_SIZE,
    iterations =
      DEFAULT_ITERATIONS,
    confidenceLevel =
      DEFAULT_CONFIDENCE_LEVEL,
    seed =
      DEFAULT_SEED,
  }) => {
    if (
      !comparison ||
      typeof comparison !==
        "object"
    ) {
      throw new Error(
        "FORECAST_COMPARISON_REQUIRED"
      );
    }

    const horizons =
      {};

    for (
      const [
        horizon,
        horizonComparison,
      ] of
        Object.entries(
          comparison.horizons
        )
    ) {
      const pairs =
        horizonComparison
          .pairs;

      const issueIntervalMs =
        inferIssueIntervalMs(
          pairs
        );

      const hacLag =
        resolveHacLag({
          horizon,

          issueIntervalMs,
        });

      const horizonSeedOffset =
        Math.round(
          parseHorizonMs(
            horizon
          ) /
          ONE_HOUR_MS
        );

      horizons[
        horizon
      ] = {
        horizon,

        pairedCount:
          pairs.length,

        issueIntervalMs,

        hacLag,

        absoluteError:
          evaluateMetric({
            pairs,

            field:
              "absoluteErrorAdvantage",

            hacLag,

            issueIntervalMs,

            blockSize,

            iterations,

            confidenceLevel,

            seed:
              seed +
              horizonSeedOffset +
              1000,
          }),

        squaredError:
          evaluateMetric({
            pairs,

            field:
              "squaredErrorAdvantage",

            hacLag,

            issueIntervalMs,

            blockSize,

            iterations,

            confidenceLevel,

            seed:
              seed +
              horizonSeedOffset +
              2000,
          }),

        qlike:
          evaluateMetric({
            pairs,

            field:
              "qlikeAdvantage",

            hacLag,

            issueIntervalMs,

            blockSize,

            iterations,

            confidenceLevel,

            seed:
              seed +
              horizonSeedOffset +
              3000,
          }),
      };
    }

    return {
      inferenceVersion:
        "forecast-comparison-inference-v1.0",

      advantageDefinition:
        "BENCHMARK_LOSS_MINUS_CANDIDATE_LOSS",

      hac: {
        estimator:
          "NEWEY_WEST",

        kernel:
          "BARTLETT",

        lagPolicy:
          "MAX_ONE_ISSUE_OR_OVERLAP_STEPS",
      },

      bootstrap: {
        method:
          "MOVING_BLOCK",

        blockSize,

        blockSizeUnit:
          "FORECAST_ISSUE_OBSERVATIONS",

        iterations,

        confidenceLevel,
      },

      decisionRule: {
        alpha:
          0.05,

        candidateSupported:
          "HAC_ONE_SIDED_P_LT_0_05_AND_BOOTSTRAP_CI_LOWER_GT_0",

        benchmarkSupported:
          "HAC_ONE_SIDED_P_LT_0_05_AND_BOOTSTRAP_CI_UPPER_LT_0",

        otherwise:
          "INCONCLUSIVE",
      },

      horizons,
    };
  };

module.exports = {
  calculateForecastComparisonInference,
};