const mean = (
  values
) => {
  if (
    !Array.isArray(
      values
    ) ||
    values.length ===
      0
  ) {
    return null;
  }

  return values.reduce(
    (
      sum,
      value
    ) =>
      sum + value,
    0
  ) /
    values.length;
};

const calculateMetricWindow = ({
  pairs,
  candidateField,
  benchmarkField,
  advantageField,
}) => {
  const candidateValues =
    pairs.map(
      (pair) =>
        pair[
          candidateField
        ]
    );

  const benchmarkValues =
    pairs.map(
      (pair) =>
        pair[
          benchmarkField
        ]
    );

  const advantages =
    pairs.map(
      (pair) =>
        pair[
          advantageField
        ]
    );

  let candidateBetterCount =
    0;

  let benchmarkBetterCount =
    0;

  let tieCount =
    0;

  for (
    const advantage of
      advantages
  ) {
    if (
      advantage >
      0
    ) {
      candidateBetterCount +=
        1;
    } else if (
      advantage <
      0
    ) {
      benchmarkBetterCount +=
        1;
    } else {
      tieCount +=
        1;
    }
  }

  return {
    candidateMean:
      mean(
        candidateValues
      ),

    benchmarkMean:
      mean(
        benchmarkValues
      ),

    meanAdvantage:
      mean(
        advantages
      ),

    candidateBetterCount,

    benchmarkBetterCount,

    tieCount,

    candidateWinRate:
      candidateBetterCount /
      pairs.length,

    benchmarkWinRate:
      benchmarkBetterCount /
      pairs.length,
  };
};

const calculateWindow = ({
  pairs,
}) => ({
  absoluteError:
    calculateMetricWindow({
      pairs,

      candidateField:
        "candidateAbsoluteError",

      benchmarkField:
        "benchmarkAbsoluteError",

      advantageField:
        "absoluteErrorAdvantage",
    }),

  squaredError:
    calculateMetricWindow({
      pairs,

      candidateField:
        "candidateSquaredError",

      benchmarkField:
        "benchmarkSquaredError",

      advantageField:
        "squaredErrorAdvantage",
    }),

  qlike:
    calculateMetricWindow({
      pairs,

      candidateField:
        "candidateQlike",

      benchmarkField:
        "benchmarkQlike",

      advantageField:
        "qlikeAdvantage",
    }),
});

const calculateRollingPoints = ({
  pairs,
  rollingWindow,
}) => {
  if (
    pairs.length <
    rollingWindow
  ) {
    return [];
  }

  const points =
    [];

  for (
    let endIndex =
      rollingWindow - 1;
    endIndex <
      pairs.length;
    endIndex += 1
  ) {
    const startIndex =
      endIndex -
      rollingWindow +
      1;

    const windowPairs =
      pairs.slice(
        startIndex,
        endIndex + 1
      );

    const firstPair =
      windowPairs[0];

    const lastPair =
      windowPairs[
        windowPairs.length -
        1
      ];

    points.push({
      issuedAt:
        lastPair.issuedAt,

      windowStartIssuedAt:
        firstPair.issuedAt,

      windowEndIssuedAt:
        lastPair.issuedAt,

      observationCount:
        windowPairs.length,

      ...calculateWindow({
        pairs:
          windowPairs,
      }),
    });
  }

  return points;
};

const calculateRollingForecastComparison =
  ({
    comparison,
    rollingWindow = 30,
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

    if (
      !Number.isInteger(
        rollingWindow
      ) ||
      rollingWindow < 2
    ) {
      throw new Error(
        "INVALID_FORECAST_COMPARISON_ROLLING_WINDOW"
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

      const rolling =
        calculateRollingPoints({
          pairs,

          rollingWindow,
        });

      horizons[
        horizon
      ] = {
        horizon,

        pairedCount:
          horizonComparison
            .pairedCount,

        aggregate: {
          absoluteError:
            horizonComparison
              .absoluteError,

          squaredError:
            horizonComparison
              .squaredError,

          qlike:
            horizonComparison
              .qlike,
        },

        rollingWindow,

        rollingPointCount:
          rolling.length,

        rolling,
      };
    }

    return {
      rollingWindow,

      rollingBasis:
        "PAIRED_EVALUATED_FORECASTS",

      advantageDefinition:
        "BENCHMARK_LOSS_MINUS_CANDIDATE_LOSS",

      interpretation: {
        positive:
          "CANDIDATE_LOWER_LOSS",

        zero:
          "EQUAL_LOSS",

        negative:
          "BENCHMARK_LOWER_LOSS",
      },

      horizons,
    };
  };

module.exports = {
  calculateRollingForecastComparison,
};