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
  calculateYearlyVolatilityRobustness,
} = require(
  "../calculations/calculateYearlyVolatilityRobustness"
);

const {
  createAnalysisRun,
} = require(
  "../runs/analysisRun.repository"
);

const {
  VOLATILITY_ROBUSTNESS_V1,
} = require(
  "../protocols/volatilityRobustnessV1"
);

const {
  createAppError,
} = require(
  "../../../errors/appError"
);

const ENGINE_VERSION =
  "research-v1.2";

const hashObject = (
  value
) =>
  crypto
    .createHash("sha256")
    .update(
      JSON.stringify(value)
    )
    .digest("hex");

const validateDataset = (
  dataset
) => {
  if (
    dataset.stage !==
    "PREPARED"
  ) {
    throw createAppError({
      statusCode: 400,
      code:
        "INVALID_RESEARCH_DATASET_STAGE",
      message:
        "Research requires a PREPARED dataset",
    });
  }

  if (
    ![
      "PASS",
      "ACCEPTABLE_WITH_WARNINGS",
    ].includes(
      dataset.qualityStatus
    )
  ) {
    throw createAppError({
      statusCode: 400,
      code:
        "RESEARCH_DATASET_BLOCKED",
      message:
        "Dataset must pass quality validation before research",
    });
  }
};

const runVolatilityRobustnessResearch =
  async ({
    datasetId,
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

    validateDataset(
      dataset
    );

    const protocol =
      VOLATILITY_ROBUSTNESS_V1;

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

    const yearly =
      calculateYearlyVolatilityRobustness({
        series:
          returns.series,

        acfLag:
          protocol.acfLag,

        archLmLags:
          protocol
            .archLmLags,

        minimumSampleSize:
          protocol
            .minimumSampleSize,
      });

    const protocolChecksum =
      hashObject(
        protocol
      );

    const metrics = {
      sample: {
        returnCount:
          returns.returnCount,

        skippedIncompleteCount:
          returns
            .skippedIncompleteCount,

        skippedGapReturnCount:
          returns
            .skippedGapReturnCount,
      },

      yearly,
    };

    const run =
      await createAnalysisRun({
        datasetId:
          dataset.id,

        runType:
          "VOLATILITY_ROBUSTNESS",

        engineVersion:
          ENGINE_VERSION,

        config: {
          instrument:
            dataset.instrument,

          venue:
            dataset.venue,

          timeframe:
            dataset.sourceTimeframe,

          datasetChecksum:
            dataset.checksum,

          protocol,
          protocolChecksum,
        },

        metrics,
      });

    return {
      analysisRunId:
        run.id,

      datasetId:
        dataset.id,

      timeframe:
        dataset.sourceTimeframe,

      protocolChecksum,
      metrics,
    };
  };

module.exports = {
  runVolatilityRobustnessResearch,
};