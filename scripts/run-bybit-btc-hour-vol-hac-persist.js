const sequelize = require(
  "../src/config/database"
);

const {
  runCalendarHourHacResearch,
} = require(
  "../src/modules/research/services/runCalendarHourHacResearch.service"
);

const DATASET_ID =
  "f10885c8-f99e-494e-9ad4-fc0f5c385f26";

const formatTests = (
  tests
) =>
  tests.map((test) => ({
    Horizon:
      test.horizon,

    N:
      test.sampleSize,

    "HAC Lag":
      test.hacLag,

    Statistic:
      test.statistic,

    df:
      test.degreesOfFreedom,

    "Raw p":
      test.pValue,

    "BH p":
      test.adjustedPValue,

    Underflow:
      test.pValueUnderflow,
  }));

const run = async () => {
  try {
    await sequelize.authenticate();

    console.log(
      "Persisting BTCUSDT calendar-hour HAC research..."
    );

    const result =
      await runCalendarHourHacResearch({
        datasetId:
          DATASET_ID,
      });

    console.log(
      "\n===== DEVELOPMENT HAC ====="
    );

    console.table(
      formatTests(
        result.metrics
          .development
      )
    );

    console.log(
      "\n===== RETROSPECTIVE VALIDATION HAC ====="
    );

    console.table(
      formatTests(
        result.metrics
          .retrospectiveValidation
      )
    );

    console.log(
      "\n===== PERSISTED ANALYSIS RUN ====="
    );

    console.log({
      analysisRunId:
        result.analysisRunId,

      datasetId:
        result.datasetId,

      engineVersion:
        result.engineVersion,

      protocolId:
        result.protocolId,

      protocolVersion:
        result.protocolVersion,

      protocolChecksum:
        result.protocolChecksum,

      forwardOos:
        result.metrics
          .forwardOos
          .status,
    });
  } catch (error) {
    console.error(
      "HAC research persistence failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();