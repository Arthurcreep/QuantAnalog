const {
  buildFactorTargetMatrix,
} = require(
  "./buildFactorTargetMatrix"
);

const {
  evaluateCategoricalFactor,
} = require(
  "./evaluateCategoricalFactor"
);

const {
  calculateMovingBlockBootstrap,
} = require(
  "../calculations/factors/calculateMovingBlockBootstrap"
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

const evaluateCategoricalResearchHorizons =
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
        buildFactorTargetMatrix({
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
        evaluateCategoricalFactor({
          developmentRows,
          validationRows,

          feature:
            protocol.feature,

          target:
            protocol.target,

          hacLag,
        });

      const bootstrap =
        calculateMovingBlockBootstrap({
          rows:
            validationRows,

          categoryField:
            protocol
              .feature
              .field,

          targetField:
            protocol
              .target
              .field,

          categoryCount:
            protocol
              .feature
              .categoryCount,

          lowCategory:
            evaluation
              .frozenContrast
              .lowCategory,

          highCategory:
            evaluation
              .frozenContrast
              .highCategory,

          blockSize:
            protocol
              .statistics
              .bootstrap
              .blockSizeBars,

          iterations:
            protocol
              .statistics
              .bootstrap
              .iterations,

          seed:
            protocol
              .statistics
              .bootstrap
              .seed +
            horizon.bars,
        });

      results.push({
        horizon:
          horizon.label,

        horizonBars:
          horizon.bars,

        matrixRowCount:
          matrix.length,

        evaluation,

        bootstrap,
      });
    }

    return results;
  };

module.exports = {
  evaluateCategoricalResearchHorizons,
};