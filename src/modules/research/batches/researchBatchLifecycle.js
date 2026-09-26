const {
  createResearchBatch,
  updateResearchBatch,
  linkAnalysisRunsToResearchBatch,
} = require(
  "./researchBatch.repository"
);

const resolveBatchStatus = ({
  completed,
  failed,
  skipped,
}) => {
  if (
    failed === 0 &&
    skipped === 0
  ) {
    return "COMPLETED";
  }

  if (completed > 0) {
    return "PARTIAL";
  }

  return "FAILED";
};

const createRunningResearchBatch =
  async ({
    instrumentContext,
    plan,
  }) => {
    return createResearchBatch({
      mode:
        "FULL",

      venue:
        instrumentContext.venue,

      instrument:
        instrumentContext.instrument,

      marketType:
        instrumentContext.marketType,

      status:
        "RUNNING",

      planSnapshot: {
        summary:
          plan.summary,

        items:
          plan.items,
      },

      acquisitionRequirements:
        plan.acquisitionCapabilities,

      executionSummary:
        null,

      executionDetails:
        [],

      startedAt:
        new Date(),

      completedAt:
        null,
    });
  };

const linkExecutionResultToBatch =
  async ({
    researchBatchId,
    result,
  }) => {
    if (
      !result ||
      !Array.isArray(
        result.runs
      ) ||
      result.runs.length === 0
    ) {
      return [];
    }

    const rows =
      result.runs.map(
        (run) => ({
          researchBatchId,

          analysisRunId:
            run.analysisRunId,

          hypothesisId:
            result.hypothesisId,

          timeframe:
            run.timeframe ||
            null,
        })
      );

    return linkAnalysisRunsToResearchBatch(
      rows
    );
  };

const finalizeResearchBatch =
  async ({
    researchBatchId,
    executionSummary,
    executionDetails,
  }) => {
    const status =
      resolveBatchStatus({
        completed:
          executionSummary.COMPLETED,

        failed:
          executionSummary.FAILED,

        skipped:
          executionSummary.SKIPPED,
      });

    const batch =
      await updateResearchBatch(
        researchBatchId,
        {
          status,

          executionSummary,

          executionDetails,

          completedAt:
            new Date(),
        }
      );

    return {
      status,
      batch,
    };
  };

const failResearchBatch =
  async ({
    researchBatchId,
    error,
    executionDetails = [],
  }) => {
    if (!researchBatchId) {
      return null;
    }

    return updateResearchBatch(
      researchBatchId,
      {
        status:
          "FAILED",

        executionSummary: {
          fatalError:
            error?.message ||
            "UNKNOWN_RESEARCH_BATCH_ERROR",
        },

        executionDetails,

        completedAt:
          new Date(),
      }
    );
  };

module.exports = {
  createRunningResearchBatch,
  linkExecutionResultToBatch,
  finalizeResearchBatch,
  failResearchBatch,
};