const {
  findDatasetById,
} = require(
  "../../datasets/repositories/dataset.repository"
);

const {
  buildLogReturnSeries,
} = require(
  "../series/buildLogReturnSeries"
);

const {
  validateContinuousResearchDataset,
} = require(
  "../factors/validateContinuousResearchDataset"
);

const {
  getTimeframeDurationMs,
} = require(
  "../factors/getTimeframeDurationMs"
);

const {
  buildContinuousFactorTargetMatrix,
} = require(
  "../factors/buildContinuousFactorTargetMatrix"
);

const {
  calculateContinuousHacRegression,
} = require(
  "../calculations/factors/calculateContinuousHacRegression"
);

const {
  evaluateContinuousFactorRobustness,
} = require(
  "../factors/evaluateContinuousFactorRobustness"
);

const {
  CONTINUOUS_FACTOR_ROBUSTNESS_V1,
} = require(
  "../protocols/continuousFactorRobustnessV1"
);

const {
  createAppError,
} = require(
  "../../../errors/appError"
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

const runContinuousFactorRobustness =
  async ({
    datasetId,
    factorProtocol,
    robustnessProtocol =
      CONTINUOUS_FACTOR_ROBUSTNESS_V1,
  }) => {
    const dataset =
      await findDatasetById(
        datasetId
      );

    if (!dataset) {
      throw createAppError({
        statusCode: 404,

        code:
          "DATASET_NOT_FOUND",

        message:
          `Dataset ${datasetId} not found`,
      });
    }

    validateContinuousResearchDataset({
      dataset,

      protocol:
        factorProtocol,
    });

    const returns =
      await buildLogReturnSeries({
        filePath:
          dataset.storageUri,

        timeframe:
          dataset.sourceTimeframe,

        incompletePolicy:
          factorProtocol
            .incompletePolicy,
      });

    const expectedIntervalMs =
      getTimeframeDurationMs(
        factorProtocol
          .modelTimeframe
      );

    const developmentEnd =
      Date.parse(
        factorProtocol
          .development
          .end
      );

    const validationStart =
      Date.parse(
        factorProtocol
          .retrospectiveValidation
          .start
      );

    const horizons = [];

    for (
      const horizon of
      factorProtocol.horizons
    ) {
      const matrix =
        buildContinuousFactorTargetMatrix({
          returnSeries:
            returns.series,

          protocol:
            factorProtocol,

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
          factorProtocol
            .statistics
            .hacLagFloor,

          horizon.bars
        );

      const developmentRegression =
        calculateContinuousHacRegression({
          rows:
            developmentRows,

          featureField:
            factorProtocol
              .feature
              .field,

          targetField:
            factorProtocol
              .target
              .field,

          hacLag,
        });

      const robustness =
        evaluateContinuousFactorRobustness({
          developmentRows,

          validationRows,

          featureField:
            factorProtocol
              .feature
              .field,

          targetField:
            factorProtocol
              .target
              .field,

          expectedIntervalMs,

          hacLag,

          referenceBeta:
            developmentRegression
              .beta,

          horizonBars:
            horizon.bars,

          protocol:
            robustnessProtocol,
        });

      horizons.push({
        horizon:
          horizon.label,

        horizonBars:
          horizon.bars,

        developmentBeta:
          developmentRegression
            .beta,

        robustness,
      });
    }

    return {
      datasetId:
        dataset.id,

      factorProtocol: {
        id:
          factorProtocol.id,

        version:
          factorProtocol.version,
      },

      robustnessProtocol: {
        id:
          robustnessProtocol.id,

        version:
          robustnessProtocol.version,

        evidenceUse:
          robustnessProtocol
            .evidenceUse,
      },

      horizons,
    };
  };

module.exports = {
  runContinuousFactorRobustness,
};