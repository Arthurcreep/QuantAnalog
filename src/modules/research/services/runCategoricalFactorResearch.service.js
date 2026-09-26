const crypto = require(
  "crypto"
);

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
  validateFactorResearchProtocol,
} = require(
  "../factors/validateFactorResearchProtocol"
);

const {
  validateCategoricalResearchDataset,
} = require(
  "../factors/validateCategoricalResearchDataset"
);

const {
  getTimeframeDurationMs,
} = require(
  "../factors/getTimeframeDurationMs"
);

const {
  evaluateCategoricalResearchHorizons,
} = require(
  "../factors/evaluateCategoricalResearchHorizons"
);

const {
  attachFactorMultipleTesting,
} = require(
  "../factors/attachFactorMultipleTesting"
);

const {
  createAnalysisRun,
} = require(
  "../runs/analysisRun.repository"
);

const {
  createAppError,
} = require(
  "../../../errors/appError"
);

const ENGINE_VERSION =
  "research-factor-v1";

const hashObject = (
  value
) =>
  crypto
    .createHash("sha256")
    .update(
      JSON.stringify(value)
    )
    .digest("hex");

const runCategoricalFactorResearch =
  async ({
    datasetId,
    protocol,
  }) => {
    validateFactorResearchProtocol(
      protocol
    );

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

    validateCategoricalResearchDataset({
      dataset,
      protocol,
    });

    const returns =
      await buildLogReturnSeries({
        filePath:
          dataset.storageUri,

        timeframe:
          dataset.sourceTimeframe,

        incompletePolicy:
          protocol
            .incompletePolicy,
      });

    const expectedIntervalMs =
      getTimeframeDurationMs(
        protocol.modelTimeframe
      );

    const horizonResults =
      evaluateCategoricalResearchHorizons({
        returnSeries:
          returns.series,

        protocol,

        expectedIntervalMs,
      });

    const horizons =
      attachFactorMultipleTesting(
        horizonResults
      );

    const protocolChecksum =
      hashObject(
        protocol
      );

    const metrics = {
      sample: {
        inputRowCount:
          returns.inputRowCount,

        returnCount:
          returns.returnCount,

        skippedIncompleteCount:
          returns
            .skippedIncompleteCount,

        skippedGapReturnCount:
          returns
            .skippedGapReturnCount,
      },

      horizons,

      forwardOos: {
        status:
          protocol
            .forwardOos
            .status,
      },
    };

    const analysisRun =
      await createAnalysisRun({
        datasetId:
          dataset.id,

        runType:
          "CATEGORICAL_FACTOR_RESEARCH",

        engineVersion:
          ENGINE_VERSION,

        config: {
          instrument:
            dataset.instrument,

          venue:
            dataset.venue,

          datasetChecksum:
            dataset.checksum,

          protocol,

          protocolChecksum,

          validationMode:
            "RETROSPECTIVE_HOLDOUT",

          candidateSelection:
            "DEVELOPMENT_ONLY",
        },

        metrics,
      });

    return {
      analysisRunId:
        analysisRun.id,

      datasetId:
        dataset.id,

      engineVersion:
        ENGINE_VERSION,

      protocolId:
        protocol.id,

      protocolVersion:
        protocol.version,

      protocolChecksum,

      metrics,
    };
  };

module.exports = {
  runCategoricalFactorResearch,
};