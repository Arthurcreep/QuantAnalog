const {
  calculateContinuousMovingBlockBootstrap,
} = require(
  "../calculations/factors/calculateContinuousMovingBlockBootstrap"
);

const {
  calculateYearlyContinuousFactorRobustness,
} = require(
  "../calculations/factors/calculateYearlyContinuousFactorRobustness"
);

const evaluateContinuousFactorRobustness =
  ({
    developmentRows,
    validationRows,
    featureField,
    targetField,
    expectedIntervalMs,
    hacLag,
    referenceBeta,
    horizonBars,
    protocol,
  }) => {
    if (
      !protocol ||
      typeof protocol !==
        "object"
    ) {
      throw new Error(
        "INVALID_CONTINUOUS_ROBUSTNESS_PROTOCOL"
      );
    }

    const bootstrap =
      calculateContinuousMovingBlockBootstrap({
        rows:
          validationRows,

        featureField,

        targetField,

        expectedIntervalMs,

        blockSize:
          protocol
            .bootstrap
            .blockSizeBars,

        iterations:
          protocol
            .bootstrap
            .iterations,

        seed:
          protocol
            .bootstrap
            .seed +
          horizonBars,
      });

    const yearly =
      calculateYearlyContinuousFactorRobustness({
        rows:
          developmentRows,

        featureField,

        targetField,

        referenceBeta,

        hacLag,

        minimumSampleSize:
          protocol
            .yearly
            .minimumSampleSize,

        minimumValidYears:
          protocol
            .yearly
            .minimumValidYears,

        minimumDirectionAgreementRatio:
          protocol
            .yearly
            .minimumDirectionAgreementRatio,
      });

    const bootstrapSupported =
      protocol
        .bootstrap
        .requireConfidenceIntervalExcludesZero
        ? bootstrap
            .beta
            .excludesZero
        : true;

    const yearlySupported =
      protocol
        .yearly
        .requireDirectionStability
        ? yearly
            .summary
            .directionStable
        : true;

    const robustSupported =
      bootstrapSupported &&
      yearlySupported;

    return {
      protocol: {
        id:
          protocol.id,

        version:
          protocol.version,

        supportRule:
          protocol.supportRule,
      },

      bootstrap,

      yearly,

      gates: {
        bootstrapSupported,

        yearlySupported,

        robustSupported,
      },
    };
  };

module.exports = {
  evaluateContinuousFactorRobustness,
};