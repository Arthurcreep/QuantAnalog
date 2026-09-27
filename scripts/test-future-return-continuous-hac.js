const assert = require(
  "assert"
);

const {
  buildFutureLogReturn,
} = require(
  "../src/modules/research/targets/returns/buildFutureLogReturn"
);

const {
  calculateContinuousHacRegression,
} = require(
  "../src/modules/research/calculations/factors/calculateContinuousHacRegression"
);

const buildTimestamp = (
  hour
) =>
  new Date(
    Date.UTC(
      2026,
      0,
      1,
      hour
    )
  ).toISOString();

const testFutureLogReturn =
  () => {
    const series = [
      {
        timestamp:
          buildTimestamp(0),

        logReturn:
          0.01,
      },

      {
        timestamp:
          buildTimestamp(1),

        logReturn:
          0.02,
      },

      {
        timestamp:
          buildTimestamp(2),

        logReturn:
          -0.01,
      },

      {
        timestamp:
          buildTimestamp(3),

        logReturn:
          0.03,
      },

      {
        timestamp:
          buildTimestamp(4),

        logReturn:
          0.04,
      },
    ];

    const targets =
      buildFutureLogReturn({
        series,

        horizonBars:
          2,

        expectedIntervalMs:
          60 * 60 * 1000,
      });

    assert.strictEqual(
      targets.length,
      3
    );

    assert.ok(
      Math.abs(
        targets[0]
          .futureLogReturn -
        0.01
      ) <
      1e-12
    );

    assert.strictEqual(
      targets[0]
        .timestamp,
      series[0]
        .timestamp
    );

    assert.strictEqual(
      targets[0]
        .targetStartTimestamp,
      series[1]
        .timestamp
    );

    assert.strictEqual(
      targets[0]
        .targetEndTimestamp,
      series[2]
        .timestamp
    );
  };

const testContinuousHac =
  () => {
    const rows = [];

    for (
      let index = 0;
      index < 500;
      index += 1
    ) {
      const x =
        (
          index -
          250
        ) /
        100;

      const noise =
        (
          (
            index %
            7
          ) -
          3
        ) *
        0.002;

      const y =
        0.01 +
        0.4 *
          x +
        noise;

      rows.push({
        currentReturn:
          x,

        futureReturn:
          y,
      });
    }

    const result =
      calculateContinuousHacRegression({
        rows,

        featureField:
          "currentReturn",

        targetField:
          "futureReturn",

        hacLag:
          4,
      });

    assert.ok(
      Math.abs(
        result.beta -
        0.4
      ) <
      0.01
    );

    assert.ok(
      Number.isFinite(
        result.alpha
      )
    );

    assert.ok(
      Number.isFinite(
        result.betaStdError
      )
    );

    assert.ok(
      result.betaStdError >
      0
    );

    assert.ok(
      result.pValue >= 0 &&
      result.pValue <= 1
    );

    assert.ok(
      result.rSquared >
      0.99
    );
  };

const run = () => {
  testFutureLogReturn();

  testContinuousHac();

  console.log(
    "Future log return and continuous HAC test passed."
  );
};

run();