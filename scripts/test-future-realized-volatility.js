const assert = require(
  "node:assert/strict"
);

const {
  buildFutureRealizedVolatility,
} = require(
  "../src/modules/research/targets/volatility/buildFutureRealizedVolatility"
);

const ONE_HOUR_MS =
  60 * 60 * 1000;

const series = [
  {
    timestamp:
      "2026-01-01T00:00:00.000Z",
    logReturn: 0.01,
  },
  {
    timestamp:
      "2026-01-01T01:00:00.000Z",
    logReturn: 0.02,
  },
  {
    timestamp:
      "2026-01-01T02:00:00.000Z",
    logReturn: -0.01,
  },
  {
    timestamp:
      "2026-01-01T03:00:00.000Z",
    logReturn: 0.03,
  },
  {
    timestamp:
      "2026-01-01T04:00:00.000Z",
    logReturn: -0.02,
  },
];

const run = () => {
  const targets =
    buildFutureRealizedVolatility({
      series,
      horizonBars: 2,
      expectedIntervalMs:
        ONE_HOUR_MS,
    });

  console.table(
    targets
  );

  assert.equal(
    targets.length,
    3
  );

  assert.equal(
    targets[0].timestamp,
    "2026-01-01T00:00:00.000Z"
  );

  assert.equal(
    targets[0].targetStartTimestamp,
    "2026-01-01T01:00:00.000Z"
  );

  assert.equal(
    targets[0].targetEndTimestamp,
    "2026-01-01T02:00:00.000Z"
  );

  assert.ok(
    Math.abs(
      targets[0]
        .futureRealizedVariance -
        0.0005
    ) < 1e-12
  );

  assert.ok(
    Math.abs(
      targets[0]
        .futureRealizedVolatility -
        Math.sqrt(0.0005)
    ) < 1e-12
  );

  console.log(
    "\nFuture realized volatility target test passed"
  );
};

run();