const {
  createAppError,
} = require(
  "../../../errors/appError"
);

const validateContinuousResearchDataset =
  ({
    dataset,
    protocol,
  }) => {
    if (
      dataset.stage !==
      "PREPARED"
    ) {
      throw createAppError({
        statusCode: 400,

        code:
          "INVALID_RESEARCH_DATASET_STAGE",

        message:
          "Factor research requires a PREPARED dataset",
      });
    }

    if (
      dataset.sourceTimeframe !==
      protocol.modelTimeframe
    ) {
      throw createAppError({
        statusCode: 400,

        code:
          "FACTOR_RESEARCH_TIMEFRAME_MISMATCH",

        message:
          `Protocol requires ${protocol.modelTimeframe}, dataset is ${dataset.sourceTimeframe}`,
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
          "Dataset quality status does not allow factor research",
      });
    }
  };

module.exports = {
  validateContinuousResearchDataset,
};