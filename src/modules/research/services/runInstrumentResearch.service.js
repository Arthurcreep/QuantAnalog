const {
  planInstrumentResearch,
} = require(
  "../planning/planInstrumentResearch.service"
);

const {
  bindResearchPlanDatasets,
} = require(
  "../planning/bindResearchPlanDatasets"
);

const {
  executeResearchBinding,
} = require(
  "../execution/executeResearchBinding"
);

const {
  createRunningResearchBatch,
  linkExecutionResultToBatch,
  finalizeResearchBatch,
  failResearchBatch,
} = require(
  "../batches/researchBatchLifecycle"
);

const {
  createResearchReportSnapshot,
} = require(
  "../reports/createResearchReportSnapshot.service"
);

const buildExecutionSummary = (
  results
) =>
  results.reduce(
    (
      summary,
      result
    ) => {
      summary.total += 1;

      summary[
        result.status
      ] += 1;

      summary.analysisRuns +=
        result.runs.length;

      return summary;
    },
    {
      total: 0,
      COMPLETED: 0,
      FAILED: 0,
      SKIPPED: 0,
      analysisRuns: 0,
    }
  );

const buildSkippedResult = (
  item
) => ({
  hypothesisId:
    item.hypothesisId,

  family:
    item.family,

  executor:
    item.executor,

  protocol:
    item.protocol,

  status:
    "SKIPPED",

  error:
    item.reason ||
    "DATASET_BINDING_FAILED",

  runs: [],
});

const buildFailedResult = ({
  item,
  error,
}) => ({
  hypothesisId:
    item.hypothesisId,

  family:
    item.family,

  executor:
    item.executor,

  protocol:
    item.protocol,

  status:
    "FAILED",

  error:
    error.message,

  runs: [],
});

const buildResearchReportResult = ({
  created,
  snapshot,
}) => ({
  created,

  researchReportId:
    snapshot.id,

  schemaVersion:
    snapshot.schemaVersion,

  reportEngineVersion:
    snapshot.reportEngineVersion,

  evidenceEngineVersion:
    snapshot.evidenceEngineVersion,

  evidencePolicy: {
    id:
      snapshot.evidencePolicyId,

    version:
      snapshot.evidencePolicyVersion,

    checksum:
      snapshot.evidencePolicyChecksum,
  },

  reportChecksum:
    snapshot.reportChecksum,

  createdAt:
    snapshot.created_at ||
    snapshot.createdAt ||
    null,
});

const runInstrumentResearch =
  async ({
    venue,
    instrument,
    marketType,
  }) => {
    let researchBatchId =
      null;

    const results =
      [];

    let researchPlan;
    let binding;
    let finalized;
    let executionSummary;

    /*
     * Phase 1:
     * Planning → Binding →
     * Execution → Batch finalization.
     *
     * Любая fatal error здесь
     * переводит созданный batch
     * в FAILED.
     */
    try {
      researchPlan =
        await planInstrumentResearch({
          venue,
          instrument,
          marketType,
        });

      binding =
        bindResearchPlanDatasets({
          plan:
            researchPlan.plan,

          capabilities:
            researchPlan.capabilities,
        });

      const researchBatch =
        await createRunningResearchBatch({
          instrumentContext:
            researchPlan.instrumentContext,

          plan:
            researchPlan.plan,
        });

      researchBatchId =
        researchBatch.id;

      for (
        const item of
        binding.items
      ) {
        if (
          item.bindingStatus !==
          "BOUND"
        ) {
          results.push(
            buildSkippedResult(
              item
            )
          );

          continue;
        }

        try {
          const result =
            await executeResearchBinding({
              binding:
                item,
            });

          await linkExecutionResultToBatch({
            researchBatchId,
            result,
          });

          results.push(
            result
          );
        } catch (error) {
          results.push(
            buildFailedResult({
              item,
              error,
            })
          );
        }
      }

      executionSummary =
        buildExecutionSummary(
          results
        );

      finalized =
        await finalizeResearchBatch({
          researchBatchId,

          executionSummary,

          executionDetails:
            results,
        });
    } catch (error) {
      await failResearchBatch({
        researchBatchId,

        error,

        executionDetails:
          results,
      });

      throw error;
    }

    /*
     * Phase 2:
     * Immutable final report.
     *
     * Важно:
     * snapshot строится только
     * после finalization batch.
     *
     * Ошибка Report Engine
     * НЕ должна переписывать
     * уже завершённый ResearchBatch
     * обратно в FAILED.
     */
    const reportSnapshot =
      await createResearchReportSnapshot({
        researchBatchId,
      });

    return {
      researchBatchId,

      researchBatchStatus:
        finalized.status,

      researchReport:
        buildResearchReportResult(
          reportSnapshot
        ),

      instrumentContext:
        researchPlan.instrumentContext,

      data: {
        available:
          researchPlan
            .capabilities
            .available,

        acquirable:
          researchPlan
            .acquirableData,

        researchReadyDatasetCount:
          researchPlan
            .capabilities
            .researchReadyDatasetCount,
      },

      planning: {
        summary:
          researchPlan
            .plan
            .summary,

        acquisitionCapabilities:
          researchPlan
            .plan
            .acquisitionCapabilities,
      },

      binding: {
        summary:
          binding.summary,

        allBound:
          binding.allBound,
      },

      execution: {
        summary:
          executionSummary,

        results,
      },
    };
  };

module.exports = {
  runInstrumentResearch,
};