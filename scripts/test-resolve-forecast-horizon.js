const assert = require(
  "assert"
);

const {
  resolveForecastHorizon,
} = require(
  "../src/modules/forecasting/horizons/resolveForecastHorizon"
);

const run = () => {
  assert.deepStrictEqual(
    resolveForecastHorizon({
      modelTimeframe:
        "1h",

      horizon:
        "1h",
    }),
    {
      modelTimeframe:
        "1h",

      modelTimeframeMs:
        3600000,

      horizon:
        "1h",

      horizonMs:
        3600000,

      horizonBars:
        1,
    }
  );

  assert.strictEqual(
    resolveForecastHorizon({
      modelTimeframe:
        "1h",

      horizon:
        "6h",
    })
      .horizonBars,
    6
  );

  assert.strictEqual(
    resolveForecastHorizon({
      modelTimeframe:
        "1h",

      horizon:
        "1d",
    })
      .horizonBars,
    24
  );

  assert.strictEqual(
    resolveForecastHorizon({
      modelTimeframe:
        "1h",

      horizon:
        "3d",
    })
      .horizonBars,
    72
  );

  assert.strictEqual(
    resolveForecastHorizon({
      modelTimeframe:
        "1h",

      horizon:
        "5d",
    })
      .horizonBars,
    120
  );

  assert.strictEqual(
    resolveForecastHorizon({
      modelTimeframe:
        "15m",

      horizon:
        "6h",
    })
      .horizonBars,
    24
  );

  assert.throws(
    () =>
      resolveForecastHorizon({
        modelTimeframe:
          "1h",

        horizon:
          "15m",
      }),
    /FORECAST_HORIZON_SHORTER_THAN_MODEL_TIMEFRAME/
  );

  assert.throws(
    () =>
      resolveForecastHorizon({
        modelTimeframe:
          "1h",

        horizon:
          "90m",
      }),
    /FORECAST_HORIZON_NOT_ALIGNED_TO_MODEL_TIMEFRAME/
  );

  console.log(
    "Forecast horizon resolver test passed."
  );

  console.log({
    oneHour:
      resolveForecastHorizon({
        modelTimeframe:
          "1h",

        horizon:
          "1h",
      }),

    sixHours:
      resolveForecastHorizon({
        modelTimeframe:
          "1h",

        horizon:
          "6h",
      }),

    oneDay:
      resolveForecastHorizon({
        modelTimeframe:
          "1h",

        horizon:
          "1d",
      }),

    threeDays:
      resolveForecastHorizon({
        modelTimeframe:
          "1h",

        horizon:
          "3d",
      }),

    fiveDays:
      resolveForecastHorizon({
        modelTimeframe:
          "1h",

        horizon:
          "5d",
      }),
  });
};

run();