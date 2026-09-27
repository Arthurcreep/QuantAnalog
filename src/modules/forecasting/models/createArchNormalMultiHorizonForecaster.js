const {
  fitArchNormalV1,
  forecastNextArchVariance,
} = require(
  "./archNormalV1"
);

const {
  forecastGarchVarianceHorizon,
} = require(
  "../calculations/forecastGarchVarianceHorizon"
);

const {
  ARCH_NORMAL_MULTI_HORIZON_V1,
} = require(
  "../protocols/archNormalMultiHorizonV1"
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
        series[
          index - 1
        ].timestamp
      );

    const currentTimestamp =
      Date.parse(
        series[
          index
        ].timestamp
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
        "INVALID_ARCH_FORECAST_RETURN_TIMESTAMP"
      );
    }

    if (
      currentTimestamp -
        previousTimestamp !==
      expectedIntervalMs
    ) {
      throw new Error(
        "ARCH_FORECAST_LOOKBACK_HAS_GAP"
      );
    }
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
      "INVALID_ARCH_MULTI_HORIZON_LIST"
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
      "DUPLICATE_ARCH_MULTI_HORIZON"
    );
  }

  for (
    const horizonBars of
      horizonBarsList
  ) {
    if (
      !ARCH_NORMAL_MULTI_HORIZON_V1
        .supportedHorizonBars
        .includes(
          horizonBars
        )
    ) {
      throw new Error(
        `UNSUPPORTED_ARCH_MULTI_HORIZON:${horizonBars}`
      );
    }
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

    /*
     * ARCH(1) is the GARCH recursion
     * with beta fixed exactly to zero.
     */
    beta:
      0,

    horizonBars,
  });

const createArchNormalMultiHorizonForecaster =
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
          "INVALID_ARCH_MULTI_HORIZON_TRAINING_WINDOW"
        );
      }

      if (
        !Number.isFinite(
          expectedIntervalMs
        ) ||
        expectedIntervalMs <= 0
      ) {
        throw new Error(
          "INVALID_ARCH_MULTI_HORIZON_INTERVAL"
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
          "ARCH_MULTI_HORIZON_ANCHOR_TIMESTAMP_MISMATCH"
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
          fitArchNormalV1({
            series,
          });

        parameters =
          fit.parameters;

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
          forecastNextArchVariance({
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

      const predictions =
        {};

      for (
        const horizonBars of
          horizonBarsList
      ) {
        const result =
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
            result
              .stepVariances,

          prediction:
            result
              .prediction,
        };
      }

      return {
        modelId:
          ARCH_NORMAL_MULTI_HORIZON_V1
            .modelId,

        modelVersion:
          ARCH_NORMAL_MULTI_HORIZON_V1
            .modelVersion,

        protocolId:
          ARCH_NORMAL_MULTI_HORIZON_V1
            .id,

        protocolVersion:
          ARCH_NORMAL_MULTI_HORIZON_V1
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
      forecastMany,
      getDiagnostics,
    };
  };

module.exports = {
  createArchNormalMultiHorizonForecaster,
};