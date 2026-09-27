const assert = require(
  "assert"
);

const sequelize = require(
  "../src/config/database"
);

const {
  getForecastResult,
} = require(
  "../src/modules/forecasting/services/getForecastResult.service"
);

const GARCH_FORECAST_RUN_ID =
  "75e0712d-ad69-4f10-8bc2-f82147db01a6";

const BASELINE_FORECAST_RUN_ID =
  "87272179-e508-45b4-b5a9-ebe45db777ff";

const ARCH_FORECAST_RUN_ID =
  "c8f7b5ac-5fab-4f71-b4e7-dd037ae2fc26";

const EXPECTED_HORIZONS = [
  "1h",
  "6h",
  "1d",
  "3d",
  "5d",
];

const validateCurrentForecasts = ({
  result,
  expectedModelId,
}) => {
  assert.strictEqual(
    result
      .model
      .id,
    expectedModelId
  );

  assert.strictEqual(
    result
      .currentForecasts
      .length,
    5
  );

  assert.strictEqual(
    result
      .lifecycle
      .evaluatedCount,
    5
  );

  assert.strictEqual(
    result
      .lifecycle
      .status,
    "EVALUATED"
  );

  const horizons =
    result
      .currentForecasts
      .map(
        (item) =>
          item.horizon
      );

  assert.deepStrictEqual(
    horizons,
    EXPECTED_HORIZONS
  );

  for (
    const item of
      result
        .currentForecasts
  ) {
    assert.strictEqual(
      item.status,
      "EVALUATED"
    );

    assert.ok(
      item.prediction
    );

    assert.ok(
      Number.isFinite(
        Number(
          item
            .prediction
            .value
        )
      )
    );

    assert.ok(
      item
        .prediction
        .interval
    );

    assert.ok(
      item.actual
    );

    assert.ok(
      item.evaluation
    );

    assert.ok(
      item
        .evaluation
        .metrics
    );

    assert.ok(
      item
        .intervalAssessment
    );
  }
};

const run = async () => {
  try {
    await sequelize.authenticate();

    const garch =
      await getForecastResult({
        forecastRunId:
          GARCH_FORECAST_RUN_ID,

        benchmarkForecastRunId:
          BASELINE_FORECAST_RUN_ID,

        rollingWindow:
          30,

        rollingMinObservations:
          5,
      });

    validateCurrentForecasts({
      result:
        garch,

      expectedModelId:
        "GARCH_NORMAL",
    });

    assert.strictEqual(
      garch
        .validation
        .historicalSeriesStatus,
      "HISTORICAL_SERIES_AVAILABLE"
    );

    assert.strictEqual(
      garch
        .performance
        .runCount,
      90
    );

    assert.ok(
      garch
        .baselineComparison
    );

    assert.strictEqual(
      garch
        .baselineComparison
        .commonIssueCount,
      90
    );

    const arch =
      await getForecastResult({
        forecastRunId:
          ARCH_FORECAST_RUN_ID,
      });

    validateCurrentForecasts({
      result:
        arch,

      expectedModelId:
        "ARCH_NORMAL",
    });

    assert.strictEqual(
      arch
        .baselineComparison,
      null
    );

    assert.strictEqual(
      arch
        .validation
        .baselineComparisonAvailable,
      false
    );

    assert.ok(
      arch
        .performance
        .runCount >=
      1
    );

    console.log(
      "Forecast Result service test passed."
    );

    console.log(
      "\nGARCH RESULT"
    );

    console.log({
      forecastRunId:
        garch
          .forecastRun
          .id,

      model:
        `${garch.model.id}@${garch.model.version}`,

      protocol:
        `${garch.protocol.id}@${garch.protocol.version}`,

      lifecycle:
        garch
          .lifecycle
          .status,

      seriesRunCount:
        garch
          .performance
          .runCount,

      baselineCommonIssueCount:
        garch
          .baselineComparison
          .commonIssueCount,

      currentRunIntervalCoverage:
        garch
          .currentRunIntervalAssessment
          .coverage,
    });

    console.table(
      garch
        .currentForecasts
        .map(
          (item) => ({
            horizon:
              item.horizon,

            forecast:
              item
                .prediction
                .value,

            lower:
              item
                .prediction
                .interval
                .lower,

            upper:
              item
                .prediction
                .interval
                .upper,

            actual:
              item
                .actual
                .value,

            covered:
              item
                .intervalAssessment
                .covered,

            qlike:
              item
                .evaluation
                .metrics
                .qlike,
          })
        )
    );

    console.log(
      "\nARCH RESULT"
    );

    console.log({
      forecastRunId:
        arch
          .forecastRun
          .id,

      model:
        `${arch.model.id}@${arch.model.version}`,

      protocol:
        `${arch.protocol.id}@${arch.protocol.version}`,

      lifecycle:
        arch
          .lifecycle
          .status,

      seriesRunCount:
        arch
          .performance
          .runCount,

      historicalSeriesStatus:
        arch
          .validation
          .historicalSeriesStatus,

      currentRunIntervalCoverage:
        arch
          .currentRunIntervalAssessment
          .coverage,
    });

    console.table(
      arch
        .currentForecasts
        .map(
          (item) => ({
            horizon:
              item.horizon,

            forecast:
              item
                .prediction
                .value,

            actual:
              item
                .actual
                .value,

            covered:
              item
                .intervalAssessment
                .covered,

            qlike:
              item
                .evaluation
                .metrics
                .qlike,
          })
        )
    );
  } catch (error) {
    console.error(
      "Forecast Result service test failed:",
      error
    );

    process.exitCode =
      1;
  } finally {
    await sequelize.close();
  }
};

run();