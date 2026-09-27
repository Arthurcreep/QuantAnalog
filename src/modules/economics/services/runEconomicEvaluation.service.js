const crypto = require(
  "crypto"
);

const {
  findAnalysisRunById,
  createAnalysisRun,
} = require(
  "../../research/runs/analysisRun.repository"
);

const {
  evaluateEconomicRun,
} = require(
  "../evaluation/evaluateEconomicRun"
);

const {
  buildEconomicMetricsSnapshot,
} = require(
  "../evaluation/buildEconomicMetricsSnapshot"
);

const {
  createAppError,
} = require(
  "../../../errors/appError"
);

const RUN_TYPE =
  "ECONOMIC_EVALUATION";

const hashObject = (
  value
) =>
  crypto
    .createHash(
      "sha256"
    )
    .update(
      JSON.stringify(
        value
      )
    )
    .digest(
      "hex"
    );

const runEconomicEvaluation =
  async ({
    sourceAnalysisRunId,
    costModel,
    decisionRule,
    startingCapital,
    startTimestamp,
    periodsPerYear,
    trades,
    grossPnlSeries,
    riskFreeRatePerPeriod = 0,
    minimumAcceptableReturnPerPeriod = 0,
  }, options = {}) => {
    const sourceAnalysisRun =
      await findAnalysisRunById(
        sourceAnalysisRunId,
        options
      );

    if (!sourceAnalysisRun) {
      throw createAppError({
        statusCode:
          404,

        code:
          "SOURCE_ANALYSIS_RUN_NOT_FOUND",

        message:
          `AnalysisRun ${sourceAnalysisRunId} not found`,
      });
    }

    const executionInput = {
      startingCapital,

      startTimestamp,

      periodsPerYear,

      trades,

      grossPnlSeries,

      riskFreeRatePerPeriod,

      minimumAcceptableReturnPerPeriod,
    };

    const executionInputChecksum =
      hashObject(
        executionInput
      );

    const result =
      evaluateEconomicRun({
        costModel,

        decisionRule,

        ...executionInput,
      });

    const metrics =
      buildEconomicMetricsSnapshot(
        result
      );

    const analysisRun =
      await createAnalysisRun(
        {
          datasetId:
            sourceAnalysisRun
              .datasetId,

          runType:
            RUN_TYPE,

          engineVersion:
            result
              .engineVersion,

          config: {
            sourceAnalysisRun: {
              id:
                sourceAnalysisRun
                  .id,

              runType:
                sourceAnalysisRun
                  .runType,

              engineVersion:
                sourceAnalysisRun
                  .engineVersion,
            },

            decisionRule,

            decisionRuleChecksum:
              result
                .decisionRule
                .checksum,

            costModel,

            costModelChecksum:
              result
                .costModel
                .checksum,

            executionInput: {
              persistence:
                "INLINE_JSONB_V1",

              checksum:
                executionInputChecksum,

              payload:
                executionInput,
            },
          },

          metrics,
        },
        options
      );

    return {
      analysisRunId:
        analysisRun.id,

      datasetId:
        analysisRun
          .datasetId,

      runType:
        RUN_TYPE,

      engineVersion:
        result
          .engineVersion,

      sourceAnalysisRunId:
        sourceAnalysisRun.id,

      decisionRuleChecksum:
        result
          .decisionRule
          .checksum,

      costModelChecksum:
        result
          .costModel
          .checksum,

      executionInputChecksum,

      metrics,
    };
  };

module.exports = {
  RUN_TYPE,
  runEconomicEvaluation,
};