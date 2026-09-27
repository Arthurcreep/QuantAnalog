const mean = (
  values
) => {
  if (
    !Array.isArray(values) ||
    values.length === 0
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

const median = (
  values
) => {
  if (
    !Array.isArray(values) ||
    values.length === 0
  ) {
    return null;
  }

  const sorted =
    [...values].sort(
      (
        first,
        second
      ) =>
        first - second
    );

  const middle =
    Math.floor(
      sorted.length /
      2
    );

  if (
    sorted.length %
      2 ===
    1
  ) {
    return sorted[
      middle
    ];
  }

  return (
    sorted[
      middle - 1
    ] +
    sorted[
      middle
    ]
  ) /
    2;
};

const buildMetrics = (
  observations
) => {
  if (
    !Array.isArray(
      observations
    ) ||
    observations.length ===
      0
  ) {
    return {
      observationCount:
        0,

      mae:
        null,

      rmse:
        null,

      bias:
        null,

      meanQlike:
        null,

      medianQlike:
        null,
    };
  }

  const absoluteErrors =
    observations.map(
      (item) =>
        item.absoluteError
    );

  const squaredErrors =
    observations.map(
      (item) =>
        item.squaredError
    );

  const errors =
    observations.map(
      (item) =>
        item.error
    );

  const qlikes =
    observations.map(
      (item) =>
        item.qlike
    );

  const meanSquaredError =
    mean(
      squaredErrors
    );

  return {
    observationCount:
      observations.length,

    mae:
      mean(
        absoluteErrors
      ),

    rmse:
      Math.sqrt(
        meanSquaredError
      ),

    /*
     * Existing evaluator semantics:
     *
     * error = actual - forecast
     *
     * positive bias:
     * model tends to underforecast
     *
     * negative bias:
     * model tends to overforecast
     */
    bias:
      mean(
        errors
      ),

    meanQlike:
      mean(
        qlikes
      ),

    medianQlike:
      median(
        qlikes
      ),
  };
};

const extractObservation = ({
  run,
  horizon,
}) => {
  const horizonResult =
    run.horizons[
      horizon
    ];

  if (
    !horizonResult ||
    !horizonResult
      .evaluation
  ) {
    return null;
  }

  const metrics =
    horizonResult
      .evaluation
      .metrics;

  if (
    !metrics ||
    !metrics.volatility
  ) {
    return null;
  }

  const absoluteError =
    Number(
      metrics
        .volatility
        .absoluteError
    );

  const squaredError =
    Number(
      metrics
        .volatility
        .squaredError
    );

  const error =
    Number(
      metrics
        .volatility
        .error
    );

  const qlike =
    Number(
      metrics.qlike
    );

  if (
    !Number.isFinite(
      absoluteError
    ) ||
    !Number.isFinite(
      squaredError
    ) ||
    !Number.isFinite(
      error
    ) ||
    !Number.isFinite(
      qlike
    )
  ) {
    throw new Error(
      `INVALID_FORECAST_PERFORMANCE_METRICS:${horizon}`
    );
  }

  return {
    forecastRunId:
      run.forecastRunId,

    issuedAt:
      run.issuedAt,

    forecastId:
      horizonResult
        .forecastId,

    prediction:
      horizonResult
        .prediction
        .value,

    actual:
      horizonResult
        .actual
        .value,

    absoluteError,

    squaredError,

    error,

    qlike,
  };
};

const buildRollingPerformance = ({
  observations,
  windowSize,
  minObservations,
}) => {
  const rolling =
    [];

  for (
    let index = 0;
    index <
      observations.length;
    index += 1
  ) {
    const startIndex =
      Math.max(
        0,
        index -
          windowSize +
          1
      );

    const window =
      observations.slice(
        startIndex,
        index + 1
      );

    if (
      window.length <
      minObservations
    ) {
      continue;
    }

    rolling.push({
      issuedAt:
        observations[
          index
        ].issuedAt,

      windowStartIssuedAt:
        window[0]
          .issuedAt,

      windowEndIssuedAt:
        window[
          window.length - 1
        ].issuedAt,

      ...buildMetrics(
        window
      ),
    });
  }

  return rolling;
};

const calculateForecastPerformance =
  ({
    series,
    rollingWindow = 30,
    rollingMinObservations = 5,
  }) => {
    if (
      !series ||
      !Array.isArray(
        series.runs
      ) ||
      !Array.isArray(
        series.horizons
      )
    ) {
      throw new Error(
        "INVALID_FORECAST_SERIES"
      );
    }

    if (
      !Number.isInteger(
        rollingWindow
      ) ||
      rollingWindow <= 0
    ) {
      throw new Error(
        "INVALID_FORECAST_ROLLING_WINDOW"
      );
    }

    if (
      !Number.isInteger(
        rollingMinObservations
      ) ||
      rollingMinObservations <= 0 ||
      rollingMinObservations >
        rollingWindow
    ) {
      throw new Error(
        "INVALID_FORECAST_ROLLING_MIN_OBSERVATIONS"
      );
    }

    const horizons =
      {};

    for (
      const horizon of
        series.horizons
    ) {
      const observations =
        [];

      for (
        const run of
          series.runs
      ) {
        const observation =
          extractObservation({
            run,

            horizon,
          });

        if (observation) {
          observations.push(
            observation
          );
        }
      }

      const aggregate =
        buildMetrics(
          observations
        );

      horizons[
        horizon
      ] = {
        horizon,

        forecastCount:
          series.runs.length,

        evaluatedCount:
          observations.length,

        pendingCount:
          series.runs.length -
          observations.length,

        evaluationCoverage:
          series.runs.length > 0
            ? observations.length /
              series.runs.length
            : null,

        aggregate,

        rolling: {
          windowSize:
            rollingWindow,

          minObservations:
            rollingMinObservations,

          basis:
            "EVALUATED_FORECASTS_ONLY",

          points:
            buildRollingPerformance({
              observations,

              windowSize:
                rollingWindow,

              minObservations:
                rollingMinObservations,
            }),
        },

        observations,
      };
    }

    return {
      metricDefinitions: {
        mae:
          "MEAN_ABSOLUTE_ERROR",

        rmse:
          "ROOT_MEAN_SQUARED_ERROR",

        bias:
          "MEAN_ACTUAL_MINUS_FORECAST",

        qlike:
          "VOLATILITY_QLIKE",
      },

      rollingWindow,

      rollingMinObservations,

      horizons,
    };
  };

module.exports = {
  calculateForecastPerformance,
};