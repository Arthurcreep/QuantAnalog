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

      results.push({
        horizon:
          horizon.label,

        horizonBars:
          horizon.bars,

        matrixRowCount:
          matrix.length,

        evaluation,
      });
    }

    return results;
  };

module.exports = {
  evaluateContinuousResearchHorizons,
};