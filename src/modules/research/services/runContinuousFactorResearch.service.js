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
  evaluateContinuousResearchHorizons,
} = require(
  "../factors/evaluateContinuousResearchHorizons"
);

const {
  attachFactorMultipleTesting,
} = require(
  "../factors/attachFactorMultipleTesting"
);

const {
  CONTINUOUS_FACTOR_ROBUSTNESS_V1,
} = require(
  "../protocols/continuousFactorRobustnessV1"
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
  "research-continuous-factor-v1.1";

const hashObject = (
  value
) =>
  crypto
    .createHash("sha256")
    .update(
      JSON.stringify(value)
    )
    .digest("hex");

const runContinuousFactorResearch =
  async ({
    datasetId,
    protocol,
  }) => {
    validateFactorResearchProtocol(
      protocol
    );

    if (
      protocol
        .feature
        .kind !==
      "CONTINUOUS"
    ) {
      throw new Error(
        "CONTINUOUS_FACTOR_PROTOCOL_REQUIRED"
      );
    }

    const robustnessEnabled =
      protocol
        .robustness
        ?.enabled ===
      true;

    const robustnessEvidenceEligible =
      protocol
        .robustness
        ?.evidenceEligible ===
      true;

    if (
      robustnessEvidenceEligible &&
      !robustnessEnabled
    ) {
      throw new Error(
        "ROBUSTNESS_EVIDENCE_REQUIRES_ENABLED_ROBUSTNESS"
      );
    }

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
      evaluateContinuousResearchHorizons({
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

    const robustnessProtocol =
      robustnessEnabled
        ? CONTINUOUS_FACTOR_ROBUSTNESS_V1
        : null;

    const robustnessProtocolChecksum =
      robustnessProtocol
        ? hashObject(
            robustnessProtocol
          )
        : null;

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

      robustnessEvidence: {
        enabled:
          robustnessEnabled,

        eligible:
          robustnessEvidenceEligible,

        protocolId:
          robustnessProtocol
            ?.id ??
          null,

        protocolVersion:
          robustnessProtocol
            ?.version ??
          null,

        protocolChecksum:
          robustnessProtocolChecksum,
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
          "CONTINUOUS_FACTOR_RESEARCH",

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

          robustnessProtocol,

          robustnessProtocolChecksum,

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

      robustnessProtocolChecksum,

      metrics,
    };
  };

module.exports = {
  runContinuousFactorResearch,
};