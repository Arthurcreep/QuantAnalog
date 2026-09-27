const {
  buildRollingRealizedVolatilityFeature,
} = require(
  "../features/volatility/buildRollingRealizedVolatilityFeature"
);

const {
  buildRollingVolumeZScoreFeature,
} = require(
  "../features/volume/buildRollingVolumeZScoreFeature"
);

const buildLogReturnFeatureSeries =
  ({
    returnSeries,
  }) =>
    returnSeries.map(
      (item) => {
        const logReturn =
          Number(
            item.logReturn
          );

        if (
          !Number.isFinite(
            logReturn
          )
        ) {
          throw new Error(
            "INVALID_RETURN_VALUE"
          );
        }

        return {
          timestamp:
            item.timestamp,

          logReturn,
        };
      }
    );

const buildAbsoluteReturnFeatureSeries =
  ({
    returnSeries,
  }) =>
    returnSeries.map(
      (item) => {
        const logReturn =
          Number(
            item.logReturn
          );

        if (
          !Number.isFinite(
            logReturn
          )
        ) {
          throw new Error(
            "INVALID_RETURN_VALUE"
          );
        }

        return {
          timestamp:
            item.timestamp,

          absoluteReturn:
            Math.abs(
              logReturn
            ),
        };
      }
    );

const validateVolumeZScoreProtocol =
  (
    protocol
  ) => {
    const feature =
      protocol.feature;

    if (
      feature.transform !==
        "LOG1P" ||
      feature.baselineMode !==
        "PREVIOUS_BARS_EXCLUDE_CURRENT" ||
      feature.standardDeviation !==
        "POPULATION"
    ) {
      throw new Error(
        "UNSUPPORTED_VOLUME_ZSCORE_CONFIGURATION"
      );
    }
  };

const buildContinuousFeatureSeries =
  ({
    returnSeries,
    protocol,
    expectedIntervalMs,
  }) => {
    const featureName =
      protocol
        ?.feature
        ?.name;

    if (
      featureName ===
      "LOG_RETURN"
    ) {
      return buildLogReturnFeatureSeries({
        returnSeries,
      });
    }

    if (
      featureName ===
      "ABS_RETURN"
    ) {
      return buildAbsoluteReturnFeatureSeries({
        returnSeries,
      });
    }

    if (
      featureName ===
      "REALIZED_VOLATILITY"
    ) {
      return buildRollingRealizedVolatilityFeature({
        series:
          returnSeries,

        windowSizeBars:
          protocol
            .feature
            .windowSizeBars,

        expectedIntervalMs,
      });
    }

    if (
      featureName ===
      "VOLUME_ZSCORE"
    ) {
      validateVolumeZScoreProtocol(
        protocol
      );

      return buildRollingVolumeZScoreFeature({
        series:
          returnSeries,

        windowSizeBars:
          protocol
            .feature
            .windowSizeBars,

        expectedIntervalMs,
      });
    }

    throw new Error(
      `UNSUPPORTED_CONTINUOUS_FEATURE:${featureName}`
    );
  };

module.exports = {
  buildContinuousFeatureSeries,
};