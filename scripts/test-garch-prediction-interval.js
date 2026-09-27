const assert = require(
  "assert"
);

const {
  calculateGarchRealizedVolatilityInterval,
} = require(
  "../src/modules/forecasting/calculations/calculateGarchRealizedVolatilityInterval"
);

const PARAMETERS = {
  omega:
    2.9252922250525343e-7,

  alpha:
    0.13580111383942917,

  beta:
    0.8631988861605613,
};

const ONE_STEP_VARIANCE =
  0.000013550811287348905;

const CASES = [
  {
    horizon:
      "1h",

    horizonBars:
      1,

    expectedPoint:
      0.0036811426605537724,
  },

  {
    horizon:
      "6h",

    horizonBars:
      6,

    expectedPoint:
      0.009245754079962231,
  },

  {
    horizon:
      "1d",

    horizonBars:
      24,

    expectedPoint:
      0.02004135256644425,
  },

  {
    horizon:
      "3d",

    horizonBars:
      72,

    expectedPoint:
      0.04089464646328617,
  },

  {
    horizon:
      "5d",

    horizonBars:
      120,

    expectedPoint:
      0.05951381719210814,
  },
];

const EPSILON =
  1e-12;

const run = () => {
  const results =
    CASES.map(
      ({
        horizon,
        horizonBars,
        expectedPoint,
      }) => {
        const result =
          calculateGarchRealizedVolatilityInterval({
            oneStepVariance:
              ONE_STEP_VARIANCE,

            parameters:
              PARAMETERS,

            horizonBars,

            confidenceLevel:
              0.95,
          });

        assert.ok(
          Math.abs(
            result
              .point
              .volatility -
              expectedPoint
          ) <
            EPSILON,
          `${horizon} point forecast changed`
        );

        assert.ok(
          result
            .interval
            .volatility
            .lower >= 0
        );

        assert.ok(
          result
            .interval
            .volatility
            .lower <
            result
              .point
              .volatility
        );

        assert.ok(
          result
            .interval
            .volatility
            .upper >
            result
              .point
              .volatility
        );

        return {
          horizon,

          point:
            result
              .point
              .volatility,

          lower95:
            result
              .interval
              .volatility
              .lower,

          upper95:
            result
              .interval
              .volatility
              .upper,

          effectiveDf:
            result
              .approximation
              .degreesOfFreedom,
        };
      }
    );

  console.log(
    "GARCH prediction interval test passed."
  );

  console.table(
    results
  );
};

run();