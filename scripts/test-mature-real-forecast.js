const assert = require(
  "assert"
);

const sequelize = require(
  "../src/config/database"
);

const {
  runHistoricalVolatilityForecast,
} = require(
  "../src/modules/forecasting/services/runHistoricalVolatilityForecast.service"
);

const {
  matureForecast,
} = require(
  "../src/modules/forecasting/services/matureForecast.service"
);

const run = async () => {
  const datasetId =
    process.argv[2];

  if (!datasetId) {
    throw new Error(
      "DATASET_ID_REQUIRED"
    );
  }

  let transaction;

  try {
    await sequelize.authenticate();

    transaction =
      await sequelize.transaction();

    const issued =
      await runHistoricalVolatilityForecast(
        {
          datasetId,

          issuedAt:
            "2026-09-20T13:00:00.000Z",

          lookbackBars:
            168,

          horizonBars:
            1,
        },
        {
          transaction,
        }
      );

    /*
     * At 13:59 the 13:00 candle
     * is not closed yet.
     */

    let prematureBlocked =
      false;

    try {
      await matureForecast(
        {
          forecastId:
            issued
              .forecast
              .id,

          actualDatasetId:
            datasetId,

          observedAt:
            "2026-09-20T13:59:59.999Z",
        },
        {
          transaction,
        }
      );
    } catch (error) {
      prematureBlocked =
        error.message ===
        "FORECAST_NOT_MATURE";
    }

    assert.strictEqual(
      prematureBlocked,
      true
    );

    const matured =
      await matureForecast(
        {
          forecastId:
            issued
              .forecast
              .id,

          actualDatasetId:
            datasetId,

          observedAt:
            "2026-09-20T14:00:00.000Z",
        },
        {
          transaction,
        }
      );

    assert.strictEqual(
      matured.created,
      true
    );

    assert.strictEqual(
      matured.engineVersion,
      "forecast-maturity-v1.0"
    );

    assert.strictEqual(
      matured
        .outcome
        .forecastId,
      issued
        .forecast
        .id
    );

    assert.strictEqual(
      matured
        .outcome
        .actualDatasetId,
      datasetId
    );

    assert.strictEqual(
      matured
        .outcome
        .actual
        .target,
      "FUTURE_REALIZED_VOLATILITY"
    );

    assert.strictEqual(
      matured
        .outcome
        .actual
        .unit,
      "REALIZED_VOLATILITY"
    );

    assert.strictEqual(
      matured
        .outcome
        .actual
        .horizonBars,
      1
    );

    assert.ok(
      Number.isFinite(
        matured
          .outcome
          .actual
          .value
      )
    );

    assert.ok(
      matured
        .outcome
        .actual
        .value >= 0
    );

    assert.ok(
      Number.isFinite(
        matured
          .outcome
          .actual
          .varianceValue
      )
    );

    assert.strictEqual(
      matured
        .outcome
        .actual
        .targetWindowStartAt,
      "2026-09-20T13:00:00.000Z"
    );

    assert.strictEqual(
      matured
        .outcome
        .actual
        .targetWindowEndAt,
      "2026-09-20T14:00:00.000Z"
    );

    assert.strictEqual(
      matured
        .outcome
        .actual
        .firstReturnTimestamp,
      "2026-09-20T13:00:00.000Z"
    );

    assert.strictEqual(
      matured
        .outcome
        .actual
        .lastReturnTimestamp,
      "2026-09-20T13:00:00.000Z"
    );

    /*
     * Maturity must be idempotent.
     */

    const second =
      await matureForecast(
        {
          forecastId:
            issued
              .forecast
              .id,

          actualDatasetId:
            datasetId,

          observedAt:
            "2026-09-20T15:00:00.000Z",
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
      second.outcome.id,
      matured.outcome.id
    );

    /*
     * Forecast itself remains unchanged.
     */

    assert.strictEqual(
      issued
        .forecast
        .prediction
        .value,
      issued
        .modelResult
        .prediction
        .value
    );

    const forecastValue =
      Number(
        issued
          .forecast
          .prediction
          .value
      );

    const actualValue =
      Number(
        matured
          .outcome
          .actual
          .value
      );

    const absoluteError =
      Math.abs(
        actualValue -
        forecastValue
      );

    const squaredError =
      (
        actualValue -
        forecastValue
      ) ** 2;

    console.log(
      "Real forecast maturity test passed."
    );

    console.log({
      forecastId:
        issued
          .forecast
          .id,

      outcomeId:
        matured
          .outcome
          .id,

      issuedAt:
        new Date(
          issued
            .forecast
            .issuedAt
        ).toISOString(),

      targetWindow:
        [
          matured
            .outcome
            .actual
            .targetWindowStartAt,

          matured
            .outcome
            .actual
            .targetWindowEndAt,
        ],

      forecastVolatility:
        forecastValue,

      forecastVariance:
        issued
          .forecast
          .prediction
          .varianceValue,

      actualVolatility:
        actualValue,

      actualVariance:
        matured
          .outcome
          .actual
          .varianceValue,

      absoluteError,

      squaredError,

      firstReturnTimestamp:
        matured
          .outcome
          .actual
          .firstReturnTimestamp,

      lastReturnTimestamp:
        matured
          .outcome
          .actual
          .lastReturnTimestamp,

      prematureBlocked,

      createdFirstMaturity:
        matured.created,

      createdSecondMaturity:
        second.created,
    });
  } catch (error) {
    console.error(
      "Real forecast maturity test failed:",
      error
    );

    process.exitCode =
      1;
  } finally {
    if (transaction) {
      await transaction.rollback();
    }

    await sequelize.close();
  }
};

run();