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

    const rows =
      [];

    for (
      const item of
        issuance.forecasts
    ) {
      const maturity =
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

      const result =
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

      assert.strictEqual(
        result.created,
        true
      );

      assert.strictEqual(
        result
          .evaluation
          .forecastId,
        item
          .forecast
          .id
      );

      assert.strictEqual(
        result
          .evaluation
          .outcomeId,
        maturity
          .outcome
          .id
      );

      assert.strictEqual(
        result
          .evaluation
          .evaluatorId,
        "VOLATILITY_FORECAST_EVALUATION"
      );

      assert.strictEqual(
        result
          .evaluation
          .evaluatorVersion,
        "1.0.0"
      );

      assert.ok(
        Number.isFinite(
          result
            .evaluation
            .metrics
            .volatility
            .absoluteError
        )
      );

      assert.ok(
        Number.isFinite(
          result
            .evaluation
            .metrics
            .variance
            .squaredError
        )
      );

      assert.ok(
        Number.isFinite(
          result
            .evaluation
            .metrics
            .qlike
        )
      );

      /*
       * Evaluation must be idempotent.
       */

      const second =
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

      assert.strictEqual(
        second.created,
        false
      );

      assert.strictEqual(
        second
          .evaluation
          .id,
        result
          .evaluation
          .id
      );

      rows.push({
        horizon:
          item.horizon,

        forecast:
          result
            .evaluation
            .metrics
            .volatility
            .forecast,

        actual:
          result
            .evaluation
            .metrics
            .volatility
            .actual,

        absoluteError:
          result
            .evaluation
            .metrics
            .volatility
            .absoluteError,

        squaredError:
          result
            .evaluation
            .metrics
            .volatility
            .squaredError,

        qlike:
          result
            .evaluation
            .metrics
            .qlike,
      });
    }

    assert.strictEqual(
      rows.length,
      5
    );

    console.log(
      "GARCH multi-horizon forecast evaluation test passed."
    );

    console.table(
      rows
    );

    await transaction.rollback();

    transaction =
      null;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    console.error(
      "GARCH multi-horizon forecast evaluation test failed:",
      error
    );

    process.exitCode =
      1;
  } finally {
    await sequelize.close();
  }
};

run();