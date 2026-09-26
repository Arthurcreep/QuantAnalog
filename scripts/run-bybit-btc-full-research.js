const sequelize = require(
  "../src/config/database"
);

const {
  runInstrumentResearch,
} = require(
  "../src/modules/research/services/runInstrumentResearch.service"
);

const {
  findResearchBatchById,
  findResearchBatchAnalysisRuns,
} = require(
  "../src/modules/research/batches/researchBatch.repository"
);

const run = async () => {
  try {
    await sequelize.authenticate();

    console.log(
      "Running BTCUSDT Full Research..."
    );

    const startedAt =
      Date.now();

    const result =
      await runInstrumentResearch({
        venue:
          "BYBIT",

        instrument:
          "BTCUSDT",

        marketType:
          "LINEAR",
      });

    const batch =
      await findResearchBatchById(
        result.researchBatchId
      );

    const batchRuns =
      await findResearchBatchAnalysisRuns(
        result.researchBatchId
      );

    console.log(
      "\n===== RESEARCH BATCH ====="
    );

    console.log({
      researchBatchId:
        result.researchBatchId,

      status:
        result.researchBatchStatus,

      storedStatus:
        batch.status,

      mode:
        batch.mode,

      venue:
        batch.venue,

      instrument:
        batch.instrument,

      marketType:
        batch.marketType,

      linkedAnalysisRuns:
        batchRuns.length,

      startedAt:
        batch.startedAt,

      completedAt:
        batch.completedAt,
    });

    console.log(
      "\n===== DATA ====="
    );

    console.log(
      result.data
    );

    console.log(
      "\n===== PLANNING ====="
    );

    console.log(
      result.planning
    );

    console.log(
      "\n===== BINDING ====="
    );

    console.log(
      result.binding
    );

    console.log(
      "\n===== EXECUTION SUMMARY ====="
    );

    console.log(
      result.execution.summary
    );

    console.log(
      "\n===== HYPOTHESES ====="
    );

    console.table(
      result
        .execution
        .results
        .map(
          (item) => ({
            Hypothesis:
              item.hypothesisId,

            Family:
              item.family,

            Executor:
              item.executor,

            Status:
              item.status,

            Runs:
              item.runs.length,

            Error:
              item.error ||
              "",
          })
        )
    );

    console.log(
      "\n===== BATCH ANALYSIS RUNS ====="
    );

    console.table(
      batchRuns.map(
        (item) => ({
          Hypothesis:
            item.hypothesisId,

          Timeframe:
            item.timeframe,

          AnalysisRunId:
            item.analysisRunId,
        })
      )
    );

    console.log(
      "\n===== FULL RESEARCH COMPLETE ====="
    );

    console.log({
      researchBatchId:
        result.researchBatchId,

      status:
        result.researchBatchStatus,

      seconds:
        (
          (
            Date.now() -
            startedAt
          ) /
          1000
        ).toFixed(2),

      hypothesesCompleted:
        result
          .execution
          .summary
          .COMPLETED,

      hypothesesFailed:
        result
          .execution
          .summary
          .FAILED,

      analysisRuns:
        result
          .execution
          .summary
          .analysisRuns,

      linkedAnalysisRuns:
        batchRuns.length,
    });
  } catch (error) {
    console.error(
      "Full Research failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();