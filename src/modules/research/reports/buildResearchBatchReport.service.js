const {
  loadResearchBatchReportData,
} = require(
  "./loadResearchBatchReportData"
);

const REPORT_SCHEMA_VERSION =
  "RESEARCH_REPORT_V1";

const resolveHypothesisEvidenceState =
  ({
    planStatus,
    executionStatus,
    error = null,
  }) => {
    if (
      executionStatus ===
      "COMPLETED"
    ) {
      return {
        status:
          "PENDING_EVIDENCE_AGGREGATION",

        reason:
          null,
      };
    }

    if (
      executionStatus ===
      "FAILED"
    ) {
      return {
        status:
          "EVIDENCE_EVALUATION_FAILED",

        reason:
          error ||
          "RESEARCH_EXECUTION_FAILED",
      };
    }

    if (
      executionStatus ===
      "SKIPPED"
    ) {
      return {
        status:
          "NOT_EVALUATED",

        reason:
          error ||
          "RESEARCH_EXECUTION_SKIPPED",
      };
    }

    if (
      planStatus ===
      "NOT_IMPLEMENTED"
    ) {
      return {
        status:
          "NOT_EVALUATED",

        reason:
          "IMPLEMENTATION_NOT_AVAILABLE",
      };
    }

    if (
      planStatus ===
      "NEED_ACQUISITION"
    ) {
      return {
        status:
          "NOT_EVALUATED",

        reason:
          "DATA_ACQUISITION_REQUIRED",
      };
    }

    if (
      planStatus ===
      "NEED_ACQUISITION_AND_IMPLEMENTATION"
    ) {
      return {
        status:
          "NOT_EVALUATED",

        reason:
          "DATA_AND_IMPLEMENTATION_REQUIRED",
      };
    }

    if (
      planStatus ===
      "UNAVAILABLE"
    ) {
      return {
        status:
          "NOT_EVALUATED",

        reason:
          "REQUIRED_DATA_UNAVAILABLE",
      };
    }

    return {
      status:
        "NOT_EVALUATED",

      reason:
        "RESEARCH_NOT_EXECUTED",
    };
  };

const buildAnalysisRunReport =
  ({
    link,
    run,
  }) => ({
    analysisRunId:
      run.id,

    hypothesisId:
      link.hypothesisId,

    timeframe:
      link.timeframe,

    datasetId:
      run.datasetId,

    runType:
      run.runType,

    engineVersion:
      run.engineVersion,

    config:
      run.config,

    metrics:
      run.metrics,

    createdAt:
      run.created_at ||
      run.createdAt ||
      null,
  });

const buildDatasetReport = (
  dataset
) => ({
  id:
    dataset.id,

  name:
    dataset.name,

  datasetType:
    dataset.datasetType,

  stage:
    dataset.stage,

  version:
    dataset.version,

  venue:
    dataset.venue,

  instrument:
    dataset.instrument,

  marketType:
    dataset.marketType,

  sourceTimeframe:
    dataset.sourceTimeframe,

  timezone:
    dataset.timezone,

  startTime:
    dataset.startTime,

  endTime:
    dataset.endTime,

  rowCount:
    dataset.rowCount,

  checksum:
    dataset.checksum,

  qualityStatus:
    dataset.qualityStatus,
});

const groupRunsByHypothesis = (
  runReports
) => {
  const result =
    new Map();

  for (
    const run of
    runReports
  ) {
    if (
      !result.has(
        run.hypothesisId
      )
    ) {
      result.set(
        run.hypothesisId,
        []
      );
    }

    result
      .get(
        run.hypothesisId
      )
      .push(
        run
      );
  }

  return result;
};

const buildExecutionMap = (
  executionDetails
) =>
  new Map(
    executionDetails.map(
      (item) => [
        item.hypothesisId,
        item,
      ]
    )
  );

const buildHypothesisReport = ({
  planItem,
  execution,
  runs,
}) => {
  const executionStatus =
    execution?.status ||
    null;

  const error =
    execution?.error ||
    null;

  return {
    hypothesisId:
      planItem.hypothesisId,

    title:
      planItem.title,

    family:
      planItem.family,

    hypothesisStatus:
      planItem.hypothesisStatus,

    planStatus:
      planItem.planStatus,

    dataStatus:
      planItem.dataStatus,

    executionStatus,

    executor:
      planItem
        .execution
        ?.executor ||
      null,

    protocol:
      planItem
        .execution
        ?.protocol ||
      null,

    missingData:
      planItem.missingData ||
      [],

    acquirableMissingData:
      planItem
        .acquirableMissingData ||
      [],

    unavailableData:
      planItem
        .unavailableData ||
      [],

    error,

    analysisRuns:
      runs,

    evidence:
      resolveHypothesisEvidenceState({
        planStatus:
          planItem.planStatus,

        executionStatus,

        error,
      }),
  };
};

const buildResearchBatchReport =
  async ({
    researchBatchId,
  }) => {
    const {
      batch,
      analysisRuns,
      datasets,
    } =
      await loadResearchBatchReportData({
        researchBatchId,
      });

    const executionDetails =
      Array.isArray(
        batch.executionDetails
      )
        ? batch.executionDetails
        : [];

    const executionMap =
      buildExecutionMap(
        executionDetails
      );

    const runReports =
      analysisRuns.map(
        buildAnalysisRunReport
      );

    const runsByHypothesis =
      groupRunsByHypothesis(
        runReports
      );

    const plannedItems =
      batch
        .planSnapshot
        ?.items ||
      [];

    const hypotheses =
      plannedItems.map(
        (planItem) => {
          const execution =
            executionMap.get(
              planItem.hypothesisId
            );

          const runs =
            runsByHypothesis.get(
              planItem.hypothesisId
            ) || [];

          return buildHypothesisReport({
            planItem,
            execution,
            runs,
          });
        }
      );

    const executedHypotheses =
      hypotheses.filter(
        (item) =>
          item.executionStatus ===
          "COMPLETED"
      );

    const failedHypotheses =
      hypotheses.filter(
        (item) =>
          item.executionStatus ===
          "FAILED"
      );

    const skippedHypotheses =
      hypotheses.filter(
        (item) =>
          item.executionStatus ===
          "SKIPPED"
      );

    const notEvaluatedHypotheses =
      hypotheses.filter(
        (item) =>
          item.evidence.status ===
          "NOT_EVALUATED"
      );

    const reportEvidenceStatus =
      executedHypotheses.length >
      0
        ? "PENDING_EVIDENCE_AGGREGATION"
        : "NOT_EVALUATED";

    return {
      schemaVersion:
        REPORT_SCHEMA_VERSION,

      generatedAt:
        new Date()
          .toISOString(),

      researchBatch: {
        id:
          batch.id,

        mode:
          batch.mode,

        status:
          batch.status,

        venue:
          batch.venue,

        instrument:
          batch.instrument,

        marketType:
          batch.marketType,

        startedAt:
          batch.startedAt,

        completedAt:
          batch.completedAt,
      },

      coverage: {
        planning:
          batch
            .planSnapshot
            ?.summary ||
          null,

        execution:
          batch.executionSummary,

        acquisitionRequirements:
          batch
            .acquisitionRequirements ||
          [],

        registeredHypotheses:
          hypotheses.length,

        executedHypotheses:
          executedHypotheses.length,

        failedHypotheses:
          failedHypotheses.length,

        skippedHypotheses:
          skippedHypotheses.length,

        notEvaluatedHypotheses:
          notEvaluatedHypotheses.length,

        analysisRuns:
          runReports.length,

        datasetsUsed:
          datasets.length,
      },

      datasetsUsed:
        datasets.map(
          buildDatasetReport
        ),

      hypotheses,

      evidence: {
        status:
          reportEvidenceStatus,
      },
    };
  };

module.exports = {
  REPORT_SCHEMA_VERSION,
  buildResearchBatchReport,
};