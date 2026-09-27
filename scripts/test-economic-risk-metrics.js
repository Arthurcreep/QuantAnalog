const assert = require(
  "assert"
);

const {
  calculatePeriodicPerformanceMetrics,
} = require(
  "../src/modules/economics/calculations/calculatePeriodicPerformanceMetrics"
);

const {
  calculateCalmarRatio,
} = require(
  "../src/modules/economics/calculations/calculateCalmarRatio"
);

const {
  calculateRecoveryStats,
} = require(
  "../src/modules/economics/calculations/calculateRecoveryStats"
);

const almostEqual = (
  actual,
  expected,
  tolerance =
    1e-10
) => {
  assert.ok(
    Math.abs(
      actual -
      expected
    ) <=
      tolerance,
    `Expected ${expected}, got ${actual}`
  );
};

const run = () => {
  const performance =
    calculatePeriodicPerformanceMetrics({
      returns: [
        0.02,
        -0.01,
        0.03,
        0,
      ],

      periodsPerYear:
        4,
    });

  assert.strictEqual(
    performance
      .observationCount,
    4
  );

  almostEqual(
    performance
      .averageReturn,
    0.01
  );

  almostEqual(
    performance
      .standardDeviation,
    0.018257418583505537
  );

  almostEqual(
    performance
      .downsideDeviation,
    0.005
  );

  almostEqual(
    performance
      .cumulativeReturn,
    0.040094
  );

  almostEqual(
    performance
      .annualizedReturn,
    0.040094
  );

  almostEqual(
    performance
      .sharpeRatio,
    1.0954451150103324
  );

  almostEqual(
    performance
      .sortinoRatio,
    4
  );

  const calmar =
    calculateCalmarRatio({
      annualizedReturn:
        0.12,

      maxDrawdown:
        -0.1,
    });

  almostEqual(
    calmar,
    1.2
  );

  const recovery =
    calculateRecoveryStats({
      startingCapital:
        1000,

      startTimestamp:
        "2026-01-01T00:00:00.000Z",

      equityCurve: [
        {
          timestamp:
            "2026-01-01T01:00:00.000Z",

          equityAfter:
            1100,
        },

        {
          timestamp:
            "2026-01-01T02:00:00.000Z",

          equityAfter:
            1050,
        },

        {
          timestamp:
            "2026-01-01T03:00:00.000Z",

          equityAfter:
            1080,
        },

        {
          timestamp:
            "2026-01-01T04:00:00.000Z",

          equityAfter:
            1100,
        },

        {
          timestamp:
            "2026-01-01T05:00:00.000Z",

          equityAfter:
            1200,
        },

        {
          timestamp:
            "2026-01-01T06:00:00.000Z",

          equityAfter:
            1100,
        },
      ],
    });

  assert.strictEqual(
    recovery
      .completedRecoveryCount,
    1
  );

  assert.strictEqual(
    recovery
      .longestCompletedRecoveryMs,
    3 *
      60 *
      60 *
      1000
  );

  assert.strictEqual(
    recovery
      .currentUnderwater,
    true
  );

  assert.strictEqual(
    recovery
      .currentUnderwaterStartedAt,
    "2026-01-01T05:00:00.000Z"
  );

  assert.strictEqual(
    recovery
      .currentUnderwaterDurationMs,
    60 *
      60 *
      1000
  );

  console.log(
    "Economic risk metrics test passed."
  );

  console.log({
    cumulativeReturn:
      performance
        .cumulativeReturn,

    annualizedReturn:
      performance
        .annualizedReturn,

    sharpe:
      performance
        .sharpeRatio,

    sortino:
      performance
        .sortinoRatio,

    calmar,

    completedRecoveries:
      recovery
        .completedRecoveryCount,

    longestRecoveryHours:
      recovery
        .longestCompletedRecoveryMs /
      (
        60 *
        60 *
        1000
      ),

    currentUnderwater:
      recovery
        .currentUnderwater,
  });
};

run();