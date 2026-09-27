const {
  buildContinuousFeatureSeries,
} = require(
  "./buildContinuousFeatureSeries"
);

const {
  buildContinuousTargetSeries,
} = require(
  "./buildContinuousTargetSeries"
);

const buildContinuousFactorTargetMatrix =
  ({
    returnSeries,
    protocol,
    horizonBars,
    expectedIntervalMs,
  }) => {
    if (
      !Array.isArray(
        returnSeries
      )
    ) {
      throw new Error(
        "INVALID_CONTINUOUS_RETURN_SERIES"
      );
    }

    const featureField =
      protocol
        ?.feature
        ?.field;

    const targetField =
      protocol
        ?.target
        ?.field;

    if (
      typeof featureField !==
        "string" ||
      typeof targetField !==
        "string"
    ) {
      throw new Error(
        "INVALID_CONTINUOUS_FACTOR_FIELDS"
      );
    }

    const features =
      buildContinuousFeatureSeries({
        returnSeries,

        protocol,

        expectedIntervalMs,
      });

    const targets =
      buildContinuousTargetSeries({
        returnSeries,

        protocol,

        horizonBars,

        expectedIntervalMs,
      });

    const targetByTimestamp =
      new Map(
        targets.map(
          (target) => [
            target.timestamp,
            target,
          ]
        )
      );

    const rows = [];

    for (
      const feature of
      features
    ) {
      const target =
        targetByTimestamp.get(
          feature.timestamp
        );

      if (!target) {
        continue;
      }

      const featureValue =
        Number(
          feature[
            featureField
          ]
        );

      const targetValue =
        Number(
          target[
            targetField
          ]
        );

      if (
        !Number.isFinite(
          featureValue
        ) ||
        !Number.isFinite(
          targetValue
        )
      ) {
        throw new Error(
          "INVALID_CONTINUOUS_FACTOR_MATRIX_ROW"
        );
      }

      rows.push({
        timestamp:
          feature.timestamp,

        [featureField]:
          featureValue,

        [targetField]:
          targetValue,

        featureStartTimestamp:
          feature
            .featureStartTimestamp ||
          null,

        featureEndTimestamp:
          feature
            .featureEndTimestamp ||
          feature.timestamp,

        horizonBars:
          target.horizonBars,

        targetStartTimestamp:
          target
            .targetStartTimestamp,

        targetEndTimestamp:
          target
            .targetEndTimestamp,
      });
    }

    return rows;
  };

module.exports = {
  buildContinuousFactorTargetMatrix,
};