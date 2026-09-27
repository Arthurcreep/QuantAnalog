const {
  fitGarchNormalV1,
  forecastNextGarchVariance,
} = require(
  "./garchNormalV1"
);

const {
  forecastGarchVarianceHorizon,
} = require(
  "../calculations/forecastGarchVarianceHorizon"
);

const {
  GARCH_NORMAL_MULTI_HORIZON_V1,
} = require(
  "../protocols/garchNormalMultiHorizonV1"
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
      Date.parse(
        series[index - 1]
          .timestamp
      );

    const currentTimestamp =
      Date.parse(
        series[index]
          .timestamp
      );

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

const validateHorizonBars = (
  horizonBars
) => {
  if (
    !GARCH_NORMAL_MULTI_HORIZON_V1
      .supportedHorizonBars
      .includes(
        horizonBars
      )
  ) {
    throw new Error(
      `UNSUPPORTED_GARCH_MULTI_HORIZON:${horizonBars}`
    );
  }
};

const validateHorizonBarsList = (
  horizonBarsList
) => {
  if (
    !Array.isArray(
      horizonBarsList
    ) ||
    horizonBarsList.length ===
      0
  ) {
    throw new Error(
      "INVALID_GARCH_MULTI_HORIZON_LIST"
    );
  }

  const unique =
    new Set(
      horizonBarsList
    );

  if (
    unique.size !==
    horizonBarsList.length
  ) {
    throw new Error(
      "DUPLICATE_GARCH_MULTI_HORIZON"
    );
  }

  for (
    const horizonBars of
      horizonBarsList
  ) {
    validateHorizonBars(
      horizonBars
    );
  }
};

const buildHorizonPrediction = ({
  oneStepVariance,
  parameters,
  horizonBars,
}) =>
  forecastGarchVarianceHorizon({
    oneStepVariance,

    omega:
      parameters.omega,

    alpha:
      parameters.alpha,

    beta:
      parameters.beta,

    horizonBars,
  });

const createGarchNormalMultiHorizonForecaster =
  () => {
    let parameters =
      null;

    let oneStepVariance =
      null;

    let lastAnchorTimestampMs =
      null;

    let forecastsSinceFit =
      0;

    let refitCount =
      0;

    let recursiveForecastCount =
      0;

    let nonConvergedRefitCount =
      0;

    const advanceState = ({
      series,
      modelConfig,
      expectedIntervalMs,
      anchorTimestamp,
    }) => {
      if (
        !Array.isArray(
          series
        ) ||
        series.length !==
          modelConfig
            .trainingWindowBars
      ) {
        throw new Error(
          "INVALID_GARCH_MULTI_HORIZON_TRAINING_WINDOW"
        );
      }

      if (
        !Number.isFinite(
          expectedIntervalMs
        ) ||
        expectedIntervalMs <= 0
      ) {
        throw new Error(
          "INVALID_GARCH_MULTI_HORIZON_INTERVAL"
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
        Date.parse(
          currentAnchor
            .timestamp
        );

      const suppliedAnchorTimestampMs =
        Date.parse(
          anchorTimestamp
        );

      if (
        !Number.isFinite(
          suppliedAnchorTimestampMs
        ) ||
        currentAnchorTimestampMs !==
          suppliedAnchorTimestampMs
      ) {
        throw new Error(
          "GARCH_MULTI_HORIZON_ANCHOR_TIMESTAMP_MISMATCH"
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

      let refit =
        false;

      let optimization =
        null;

      if (shouldRefit) {
        const fit =
          fitGarchNormalV1({
            series,
          });

        parameters =
          fit.parameters;

        /*
         * Internal state always contains
         * ONE-STEP conditional variance.
         *
         * Never cumulative horizon variance.
         */
        oneStepVariance =
          fit
            .prediction
            .varianceValue;

        forecastsSinceFit =
          1;

        refitCount +=
          1;

        refit =
          true;

        optimization =
          fit.optimization;

        if (
          !fit
            .optimization
            .converged
        ) {
          nonConvergedRefitCount +=
            1;
        }
      } else {
        const observedReturn =
          Number(
            currentAnchor
              .logReturn
          );

        const next =
          forecastNextGarchVariance({
            previousForecastVariance:
              oneStepVariance,

            observedReturn,

            parameters,
          });

        oneStepVariance =
          next
            .varianceValue;

        forecastsSinceFit +=
          1;

        recursiveForecastCount +=
          1;
      }

      lastAnchorTimestampMs =
        currentAnchorTimestampMs;

      return {
        refit,

        optimization,

        parameters,

        oneStepVariance,

        forecastsSinceFit,
      };
    };

    const forecastMany = ({
      series,
      modelConfig,
      horizonBarsList,
      expectedIntervalMs,
      anchorTimestamp,
    }) => {
      validateHorizonBarsList(
        horizonBarsList
      );

      const state =
        advanceState({
          series,

          modelConfig,

          expectedIntervalMs,

          anchorTimestamp,
        });

      const predictions = {};

      for (
        const horizonBars of
          horizonBarsList
      ) {
        const horizonPrediction =
          buildHorizonPrediction({
            oneStepVariance:
              state
                .oneStepVariance,

            parameters:
              state.parameters,

            horizonBars,
          });

        predictions[
          String(
            horizonBars
          )
        ] = {
          horizonBars,

          stepVariances:
            horizonPrediction
              .stepVariances,

          prediction:
            horizonPrediction
              .prediction,
        };
      }

      return {
        modelId:
          GARCH_NORMAL_MULTI_HORIZON_V1
            .modelId,

        modelVersion:
          GARCH_NORMAL_MULTI_HORIZON_V1
            .modelVersion,

        protocolId:
          GARCH_NORMAL_MULTI_HORIZON_V1.id,

        protocolVersion:
          GARCH_NORMAL_MULTI_HORIZON_V1
            .version,

        refit:
          state.refit,

        forecastsSinceFit:
          state
            .forecastsSinceFit,

        parameters:
          state.parameters,

        optimization:
          state.optimization,

        oneStepVariance:
          state
            .oneStepVariance,

        predictions,
      };
    };

    /*
     * Compatibility method for existing
     * single-horizon regression tests.
     */
    const forecast = ({
      series,
      modelConfig,
      horizonBars,
      expectedIntervalMs,
      anchorTimestamp,
    }) => {
      const result =
        forecastMany({
          series,

          modelConfig,

          horizonBarsList: [
            horizonBars,
          ],

          expectedIntervalMs,

          anchorTimestamp,
        });

      const horizonResult =
        result
          .predictions[
            String(
              horizonBars
            )
          ];

      return {
        modelId:
          result.modelId,

        modelVersion:
          result.modelVersion,

        protocolId:
          result.protocolId,

        protocolVersion:
          result.protocolVersion,

        refit:
          result.refit,

        forecastsSinceFit:
          result
            .forecastsSinceFit,

        parameters:
          result.parameters,

        optimization:
          result.optimization,

        oneStepVariance:
          result
            .oneStepVariance,

        horizonBars,

        stepVariances:
          horizonResult
            .stepVariances,

        prediction:
          horizonResult
            .prediction,
      };
    };

    const getDiagnostics =
      () => ({
        refitCount,

        recursiveForecastCount,

        nonConvergedRefitCount,

        totalForecasts:
          refitCount +
          recursiveForecastCount,
      });

    return {
      forecast,
      forecastMany,
      getDiagnostics,
    };
  };

module.exports = {
  createGarchNormalMultiHorizonForecaster,
};