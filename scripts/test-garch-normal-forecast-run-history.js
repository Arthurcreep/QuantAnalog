const assert = require(
  "assert"
);

const sequelize = require(
  "../src/config/database"
);

const {
  runGarchNormalMultiHorizonForecast,
} = require(
  "../src/modules/forecasting/services/runGarchNormalMultiHorizonForecast.service"
);

const {
  matureForecast,
} = require(
  "../src/modules/forecasting/services/matureForecast.service"
);

const {
  evaluateForecast,
} = require(
  "../src/modules/forecasting/services/evaluateForecast.service"
);

const {
  getForecastRunHistory,
} = require(
  "../src/modules/forecasting/services/getForecastRunHistory.service"
);

const DATASET_ID =
  process.argv[2];

const ISSUED_AT =
  "2026-09-15T00:00:00.000Z";

const OBSERVED_AT =
  "2026-09-20T00:00:00.000Z";

const SOURCE_ANALYSIS_RUN_ID =
  "828053be-6334-4475-a18b-a837439c8161";

const run = async () => {
  let transaction;

  try {
    if (!DATASET_ID) {
      throw new Error(
        "DATASET_ID_REQUIRED"
      );
    }

    await sequelize.authenticate();

    transaction =
      await sequelize.transaction();

    /*
     * 1. ISSUE RUN
     */

    const issuance =
      await runGarchNormalMultiHorizonForecast(
        {
          datasetId:
            DATASET_ID,

          issuedAt:
            ISSUED_AT,

          sourceAnalysisRunId:
            SOURCE_ANALYSIS_RUN_ID,
        },
        {
          transaction,
        }
      );

    const forecastRunId =
      issuance
        .forecastRun
        .run
        .id;

    /*
     * 2. HISTORY BEFORE MATURITY
     */

    const pendingHistory =
      await getForecastRunHistory(
        {
          forecastRunId,
        },
        {
          transaction,
        }
      );

    assert.strictEqual(
      pendingHistory
        .summary
        .forecastCount,
      5
    );

    assert.strictEqual(
      pendingHistory
        .summary
        .pendingOutcomeCount,
      5
    );

    assert.strictEqual(
      pendingHistory
        .summary
        .evaluatedCount,
      0
    );

    /*
     * 3. MATURE + EVALUATE
     */

    for (
      const item of
        issuance.forecasts
    ) {
      await matureForecast(
        {
          forecastId:
            item
              .forecast
              .id,

          observedAt:
            OBSERVED_AT,
        },
        {
          transaction,
        }
      );

      await evaluateForecast(
        {
          forecastId:
            item
              .forecast
              .id,
        },
        {
          transaction,
        }
      );
    }

    /*
     * 4. HISTORY AFTER EVALUATION
     */

    const completedHistory =
      await getForecastRunHistory(
        {
          forecastRunId,
        },
        {
          transaction,
        }
      );

    assert.strictEqual(
      completedHistory
        .summary
        .forecastCount,
      5
    );

    assert.strictEqual(
      completedHistory
        .summary
        .pendingOutcomeCount,
      0
    );

    assert.strictEqual(
      completedHistory
        .summary
        .maturedUnevaluatedCount,
      0
    );

    assert.strictEqual(
      completedHistory
        .summary
        .evaluatedCount,
      5
    );

    assert.deepStrictEqual(
      completedHistory
        .history
        .map(
          (item) =>
            item.horizon
        ),
      [
        "1h",
        "6h",
        "1d",
        "3d",
        "5d",
      ]
    );

    for (
      const item of
        completedHistory.history
    ) {
      assert.strictEqual(
        item.status,
        "EVALUATED"
      );

      assert.ok(
        item.forecast
      );

      assert.ok(
        item.outcome
      );

      assert.strictEqual(
        item.evaluations.length,
        1
      );

      assert.ok(
        Number.isFinite(
          item
            .evaluations[0]
            .metrics
            .qlike
        )
      );
    }

    console.log(
      "GARCH ForecastRun history test passed."
    );

    console.log({
      forecastRunId,

      runKey:
        completedHistory
          .forecastRun
          .runKey,

      model:
        `${
          completedHistory
            .forecastRun
            .modelId
        }@${
          completedHistory
            .forecastRun
            .modelVersion
        }`,

      protocol:
        `${
          completedHistory
            .forecastRun
            .protocolId
        }@${
          completedHistory
            .forecastRun
            .protocolVersion
        }`,

      summary:
        completedHistory
          .summary,
    });

    console.table(
      completedHistory
        .history
        .map(
          (item) => ({
            position:
              item.position,

            horizon:
              item.horizon,

            status:
              item.status,

            forecast:
              item
                .forecast
                .prediction
                .value,

            actual:
              item
                .outcome
                .actual
                .value,

            absoluteError:
              item
                .evaluations[0]
                .metrics
                .volatility
                .absoluteError,

            qlike:
              item
                .evaluations[0]
                .metrics
                .qlike,
          })
        )
    );

    await transaction.rollback();

    transaction =
      null;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    console.error(
      "GARCH ForecastRun history test failed:",
      error
    );

    process.exitCode =
      1;
  } finally {
    await sequelize.close();
  }
};

run();