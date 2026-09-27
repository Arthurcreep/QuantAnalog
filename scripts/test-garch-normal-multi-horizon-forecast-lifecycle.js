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
  calculateVolatilityForecastScores,
} = require(
  "../src/modules/forecasting/evaluation/calculateVolatilityForecastScores"
);

const DATASET_ID =
  process.argv[2];

const ISSUED_AT =
  "2026-09-15T00:00:00.000Z";

const OBSERVED_AT =
  "2026-09-20T00:00:00.000Z";

const SOURCE_ANALYSIS_RUN_ID =
  "828053be-6334-4475-a18b-a837439c8161";

const EXPECTED_HORIZON_BARS =
  Object.freeze({
    "1h":
      1,

    "6h":
      6,

    "1d":
      24,

    "3d":
      72,

    "5d":
      120,
  });

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
     * STEP 1:
     * issue five forecasts
     * from one GARCH fit.
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

    assert.strictEqual(
      issuance
        .forecasts
        .length,
      5
    );

    const evaluations =
      [];

    /*
     * STEP 2:
     * all five horizons have matured
     * by 2026-09-20 00:00.
     */

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

      assert.strictEqual(
        maturity.created,
        true
      );

      assert.strictEqual(
        maturity
          .outcome
          .forecastId,
        item
          .forecast
          .id
      );

      const expectedHorizonBars =
        EXPECTED_HORIZON_BARS[
          item.horizon
        ];

      assert.strictEqual(
        maturity
          .outcome
          .actual
          .horizonBars,
        expectedHorizonBars
      );

      assert.strictEqual(
        maturity
          .outcome
          .actual
          .target,
        "FUTURE_REALIZED_VOLATILITY"
      );

      const forecastVolatility =
        Number(
          item
            .forecast
            .prediction
            .value
        );

      const forecastVariance =
        Number(
          item
            .forecast
            .prediction
            .varianceValue
        );

      const actualVolatility =
        Number(
          maturity
            .outcome
            .actual
            .value
        );

      const actualVariance =
        Number(
          maturity
            .outcome
            .actual
            .varianceValue
        );

      const score =
        calculateVolatilityForecastScores({
          forecastVolatility,

          actualVolatility,

          forecastVariance,

          actualVariance,
        });

      assert.ok(
        Number.isFinite(
          score
            .volatility
            .absoluteError
        )
      );

      assert.ok(
        Number.isFinite(
          score
            .volatility
            .squaredError
        )
      );

      assert.ok(
        Number.isFinite(
          score.qlike
        )
      );

      evaluations.push({
        forecastId:
          item
            .forecast
            .id,

        horizon:
          item.horizon,

        horizonBars:
          expectedHorizonBars,

        forecastVolatility,

        actualVolatility,

        absoluteError:
          score
            .volatility
            .absoluteError,

        squaredError:
          score
            .volatility
            .squaredError,

        forecastVariance,

        actualVariance,

        qlike:
          score.qlike,

        targetWindowStartAt:
          item
            .forecast
            .targetWindowStartAt,

        targetWindowEndAt:
          item
            .forecast
            .targetWindowEndAt,

        observedAt:
          maturity
            .outcome
            .observedAt,
      });

      /*
       * STEP 3:
       * maturity must be idempotent.
       *
       * Same forecast cannot acquire
       * a second outcome.
       */

      const secondMaturity =
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

      assert.strictEqual(
        secondMaturity.created,
        false
      );

      assert.strictEqual(
        secondMaturity
          .outcome
          .id,
        maturity
          .outcome
          .id
      );
    }

    assert.strictEqual(
      evaluations.length,
      5
    );

    console.log(
      "GARCH multi-horizon forecast lifecycle test passed."
    );

    console.log({
      issuedAt:
        issuance.issuedAt,

      observedAt:
        OBSERVED_AT,

      forecastCount:
        issuance
          .forecasts
          .length,

      maturedCount:
        evaluations.length,

      informationSet:
        issuance
          .informationSet,
    });

    console.table(
      evaluations.map(
        (item) => ({
          horizon:
            item.horizon,

          bars:
            item
              .horizonBars,

          forecastVol:
            item
              .forecastVolatility,

          actualVol:
            item
              .actualVolatility,

          absoluteError:
            item
              .absoluteError,

          qlike:
            item.qlike,
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
      "GARCH multi-horizon forecast lifecycle test failed:",
      error
    );

    process.exitCode =
      1;
  } finally {
    await sequelize.close();
  }
};

run();