const {
  fitGarchNormalV1,
  forecastNextGarchVariance,
} = require(
  "./garchNormalV1"
);

const {
  GARCH_NORMAL_V1,
} = require(
  "../protocols/garchNormalV1"
);

const validateContiguousSeries = ({
  series,
  expectedIntervalMs,
}) => {
  for (
    let index = 1;
    index < series.length;
    index += 1
  ) {
    const previousTimestamp =
      new Date(
        series[index - 1]
          .timestamp
      ).getTime();

    const currentTimestamp =
      new Date(
        series[index]
          .timestamp
      ).getTime();

    if (
      !Number.isFinite(
        previousTimestamp
      ) ||
      !Number.isFinite(
        currentTimestamp
      )
    ) {
      throw new Error(
        "INVALID_FORECAST_RETURN_TIMESTAMP"
      );
    }

    if (
      currentTimestamp -
        previousTimestamp !==
      expectedIntervalMs
    ) {
      throw new Error(
        "FORECAST_LOOKBACK_HAS_GAP"
      );
    }
  }
};

const buildFitDiagnostic = ({
  fit,
  fitNumber,
  forecastIndex,
  issuedAt,
  anchorTimestamp,
}) => ({
  fitNumber,

  forecastStartIndex:
    forecastIndex,

  forecastEndIndex:
    forecastIndex,

  fittedAt:
    issuedAt,

  anchorTimestamp,

  sample:
    fit.sample,

  parameters:
    fit.parameters,

  optimization:
    fit.optimization,

  initialPrediction:
    fit.prediction,
});

const createGarchNormalWalkForwardForecaster =
  () => {
    let parameters =
      null;

    let previousForecastVariance =
      null;

    let lastAnchorTimestampMs =
      null;

    let forecastsSinceFit =
      0;

    let forecastIndex =
      0;

    let refitCount =
      0;

    let recursiveForecastCount =
      0;

    let nonConvergedRefitCount =
      0;

    let activeFit =
      null;

    const fits = [];

    const forecast = ({
      series,
      modelConfig,
      horizonBars,
      expectedIntervalMs,
      issuedAt,
      anchorTimestamp,
    }) => {
      if (
        horizonBars !==
        GARCH_NORMAL_V1
          .horizonBars
      ) {
        throw new Error(
          "GARCH_V1_SUPPORTS_ONE_BAR_HORIZON_ONLY"
        );
      }

      if (
        !Array.isArray(
          series
        ) ||
        series.length !==
          modelConfig
            .trainingWindowBars
      ) {
        throw new Error(
          "INVALID_GARCH_TRAINING_WINDOW"
        );
      }

      if (
        !Number.isFinite(
          expectedIntervalMs
        ) ||
        expectedIntervalMs <= 0
      ) {
        throw new Error(
          "INVALID_GARCH_EXPECTED_INTERVAL"
        );
      }

      validateContiguousSeries({
        series,
        expectedIntervalMs,
      });

      const currentAnchor =
        series[
          series.length - 1
        ];

      const currentAnchorTimestampMs =
        new Date(
          currentAnchor
            .timestamp
        ).getTime();

      const suppliedAnchorTimestampMs =
        new Date(
          anchorTimestamp
        ).getTime();

      if (
        currentAnchorTimestampMs !==
        suppliedAnchorTimestampMs
      ) {
        throw new Error(
          "GARCH_ANCHOR_TIMESTAMP_MISMATCH"
        );
      }

      const isSequential =
        lastAnchorTimestampMs ===
          null ||
        currentAnchorTimestampMs -
          lastAnchorTimestampMs ===
          expectedIntervalMs;

      const shouldRefit =
        parameters ===
          null ||
        !isSequential ||
        forecastsSinceFit >=
          modelConfig
            .refitEveryForecasts;

      if (shouldRefit) {
        const fit =
          fitGarchNormalV1({
            series,
          });

        parameters =
          fit.parameters;

        previousForecastVariance =
          fit
            .prediction
            .varianceValue;

        lastAnchorTimestampMs =
          currentAnchorTimestampMs;

        forecastsSinceFit =
          1;

        refitCount +=
          1;

        if (
          !fit
            .optimization
            .converged
        ) {
          nonConvergedRefitCount +=
            1;
        }

        activeFit =
          buildFitDiagnostic({
            fit,

            fitNumber:
              refitCount,

            forecastIndex,

            issuedAt,

            anchorTimestamp,
          });

        fits.push(
          activeFit
        );

        forecastIndex +=
          1;

        return {
          modelId:
            GARCH_NORMAL_V1
              .modelId,

          modelVersion:
            GARCH_NORMAL_V1
              .modelVersion,

          protocolId:
            GARCH_NORMAL_V1.id,

          protocolVersion:
            GARCH_NORMAL_V1
              .version,

          refit:
            true,

          fitNumber:
            activeFit
              .fitNumber,

          forecastsSinceFit,

          parameters,

          optimization:
            fit.optimization,

          prediction:
            fit.prediction,
        };
      }

      const observedReturn =
        Number(
          currentAnchor
            .logReturn
        );

      const prediction =
        forecastNextGarchVariance({
          previousForecastVariance,

          observedReturn,

          parameters,
        });

      previousForecastVariance =
        prediction
          .varianceValue;

      lastAnchorTimestampMs =
        currentAnchorTimestampMs;

      forecastsSinceFit +=
        1;

      recursiveForecastCount +=
        1;

      if (!activeFit) {
        throw new Error(
          "GARCH_ACTIVE_FIT_MISSING"
        );
      }

      activeFit
        .forecastEndIndex =
        forecastIndex;

      forecastIndex +=
        1;

      return {
        modelId:
          GARCH_NORMAL_V1
            .modelId,

        modelVersion:
          GARCH_NORMAL_V1
            .modelVersion,

        protocolId:
          GARCH_NORMAL_V1.id,

        protocolVersion:
          GARCH_NORMAL_V1
            .version,

        refit:
          false,

        fitNumber:
          activeFit
            .fitNumber,

        forecastsSinceFit,

        parameters,

        prediction,
      };
    };

    const getDiagnostics =
      () => ({
        refitCount,

        recursiveForecastCount,

        nonConvergedRefitCount,

        totalForecasts:
          forecastIndex,

        firstFit:
          fits[0] ||
          null,

        lastFit:
          fits[
            fits.length - 1
          ] || null,

        fits:
          fits.map(
            (fit) => ({
              ...fit,

              sample: {
                ...fit.sample,
              },

              parameters: {
                ...fit.parameters,
              },

              optimization: {
                ...fit.optimization,
              },

              initialPrediction: {
                ...fit
                  .initialPrediction,
              },
            })
          ),
      });

    return {
      forecast,
      getDiagnostics,
    };
  };

module.exports = {
  createGarchNormalWalkForwardForecaster,
};