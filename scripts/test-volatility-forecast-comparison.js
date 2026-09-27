const assert = require(
  "assert"
);

const {
  compareVolatilityForecastModels,
} = require(
  "../src/modules/forecasting/evaluation/compareVolatilityForecastModels"
);

const ONE_HOUR_MS =
  60 * 60 * 1000;

const buildRows = ({
  count,
  baselineLoss,
  candidateLoss,
}) =>
  Array.from(
    {
      length:
        count,
    },
    (
      _,
      index
    ) => {
      const issuedAt =
        new Date(
          Date.UTC(
            2025,
            0,
            1
          ) +
          index *
            ONE_HOUR_MS
        ).toISOString();

      return {
        issuedAt,

        targetStartTimestamp:
          issuedAt,

        targetEndTimestamp:
          issuedAt,

        actualVariance:
          0.0001,

        absoluteError:
          baselineLoss(
            index
          ),

        squaredError:
          baselineLoss(
            index
          ) ** 2,

        qlike:
          baselineLoss(
            index
          ),
      };
    }
  );

const run = () => {
  const baselineRows =
    buildRows({
      count:
        1000,

      baselineLoss:
        (index) =>
          1 +
          (
            index % 10
          ) *
          0.01,
    });

  const candidateRows =
    buildRows({
      count:
        1000,

      baselineLoss:
        (index) =>
          0.8 +
          (
            index % 10
          ) *
          0.01,
    });

  const result =
    compareVolatilityForecastModels({
      baselineRows,

      candidateRows,

      expectedIntervalMs:
        ONE_HOUR_MS,

      baselineModel:
        "BASELINE",

      candidateModel:
        "CANDIDATE",
    });

  assert.strictEqual(
    result.sampleSize,
    1000
  );

  assert.ok(
    result
      .absoluteError
      .observedMeanDifference >
      0
  );

  assert.ok(
    result
      .squaredError
      .observedMeanDifference >
      0
  );

  assert.ok(
    result
      .qlike
      .observedMeanDifference >
      0
  );

  assert.strictEqual(
    result
      .absoluteError
      .bootstrap
      .confidenceInterval
      .supportsCandidate,
    true
  );

  assert.ok(
    result
      .absoluteError
      .hac
      .pValueCandidateBetter <
      0.05
  );

  assert.strictEqual(
    result
      .absoluteError
      .wins
      .candidateWinRate,
    1
  );

  console.log(
    "Volatility forecast comparison test passed."
  );

  console.log({
    absoluteError:
      result.absoluteError,

    squaredError:
      result.squaredError,

    qlike:
      result.qlike,
  });
};

run();