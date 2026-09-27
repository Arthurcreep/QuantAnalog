const {
  buildContinuousFactorTargetMatrix,
} = require(
  "./buildContinuousFactorTargetMatrix"
);

const {
  evaluateContinuousFactor,
} = require(
  "./evaluateContinuousFactor"
);

const {
  evaluateContinuousFactorRobustness,
} = require(
  "./evaluateContinuousFactorRobustness"
);

const {
  CONTINUOUS_FACTOR_ROBUSTNESS_V1,
} = require(
  "../protocols/continuousFactorRobustnessV1"
);

const splitMatrix = ({
  matrix,
  developmentEnd,
  validationStart,
}) => {
  const developmentRows =
    matrix.filter(
      (row) =>
        Date.parse(
          row.targetEndTimestamp
        ) <=
        developmentEnd
    );

  const validationRows =
    matrix.filter(
      (row) =>
        Date.parse(
          row.timestamp
        ) >=
        validationStart
    );

  return {
    developmentRows,
    validationRows,
  };
};

const resolveRobustnessProtocol = (
  protocol
) => {
  const config =
    protocol.robustness;

  if (
    !config ||
    config.enabled !==
      true
  ) {
    return null;
  }

  if (
    config
      .protocol
      ?.id !==
      CONTINUOUS_FACTOR_ROBUSTNESS_V1.id ||
    config
      .protocol
      ?.version !==
      CONTINUOUS_FACTOR_ROBUSTNESS_V1.version
  ) {
    throw new Error(
      "UNSUPPORTED_CONTINUOUS_ROBUSTNESS_PROTOCOL"
    );
  }

  return CONTINUOUS_FACTOR_ROBUSTNESS_V1;
};

const evaluateContinuousResearchHorizons =
  ({
    returnSeries,
    protocol,
    expectedIntervalMs,
  }) => {
    const developmentEnd =
      Date.parse(
        protocol
          .development
          .end
      );

    const validationStart =
      Date.parse(
        protocol
          .retrospectiveValidation
          .start
      );

    if (
      !Number.isFinite(
        developmentEnd
      ) ||
      !Number.isFinite(
        validationStart
      )
    ) {
      throw new Error(
        "INVALID_CONTINUOUS_RESEARCH_SPLIT"
      );
    }

    const robustnessProtocol =
      resolveRobustnessProtocol(
        protocol
      );

    const results = [];

    for (
      const horizon of
      protocol.horizons
    ) {
      const matrix =
        buildContinuousFactorTargetMatrix({
          returnSeries,

          protocol,

          horizonBars:
            horizon.bars,

          expectedIntervalMs,
        });

      const {
        developmentRows,
        validationRows,
      } = splitMatrix({
        matrix,

        developmentEnd,

        validationStart,
      });

      const hacLag =
        Math.max(
          protocol
            .statistics
            .hacLagFloor,

          horizon.bars
        );

      const evaluation =
        evaluateContinuousFactor({
          developmentRows,

          validationRows,

          feature:
            protocol.feature,

          target:
            protocol.target,

          hacLag,
        });

      const robustness =
        robustnessProtocol
          ? evaluateContinuousFactorRobustness({
              developmentRows,

              validationRows,

              featureField:
                protocol
                  .feature
                  .field,

              targetField:
                protocol
                  .target
                  .field,

              expectedIntervalMs,

              hacLag,

              referenceBeta:
                evaluation
                  .development
                  .hac
                  .beta,

              horizonBars:
                horizon.bars,

              protocol:
                robustnessProtocol,
            })
          : null;

      results.push({
        horizon:
          horizon.label,

        horizonBars:
          horizon.bars,

        matrixRowCount:
          matrix.length,

        evaluation,

        robustness,
      });
    }

    return results;
  };

module.exports = {
  evaluateContinuousResearchHorizons,
};