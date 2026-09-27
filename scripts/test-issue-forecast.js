const assert = require(
  "assert"
);

const sequelize = require(
  "../src/config/database"
);

const {
  issueForecast,
} = require(
  "../src/modules/forecasting/services/issueForecast.service"
);

const TEST_MODEL_DEFINITION = {
  id:
    "HISTORICAL_VOLATILITY_BASELINE",

  version:
    "1.0.0",

  status:
    "FROZEN",

  target:
    "FUTURE_REALIZED_VOLATILITY",

  estimator:
    "ROLLING_REALIZED_VOLATILITY",
};

const TEST_MODEL_CONFIG = {
  lookbackBars:
    168,
};

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

    const request = {
      datasetId,

      modelId:
        TEST_MODEL_DEFINITION.id,

      modelVersion:
        TEST_MODEL_DEFINITION.version,

      modelDefinition:
        TEST_MODEL_DEFINITION,

      modelConfig:
        TEST_MODEL_CONFIG,

      target:
        "FUTURE_REALIZED_VOLATILITY",

      modelTimeframe:
        "1h",

      horizon:
        "1h",

      issuedAt:
        "2026-09-20T12:00:00.000Z",

      inputCutoffAt:
        "2026-09-20T12:00:00.000Z",

      targetWindowStartAt:
        "2026-09-20T12:00:00.000Z",

      targetWindowEndAt:
        "2026-09-20T13:00:00.000Z",

      prediction: {
        type:
          "POINT",

        value:
          0.0125,

        unit:
          "REALIZED_VOLATILITY",
      },
    };

    const first =
      await issueForecast(
        request,
        {
          transaction,
        }
      );

    assert.strictEqual(
      first.created,
      true
    );

    assert.strictEqual(
      first.engineVersion,
      "forecast-issuance-v1.0"
    );

    const second =
      await issueForecast(
        request,
        {
          transaction,
        }
      );

    assert.strictEqual(
      second.created,
      false
    );

    assert.strictEqual(
      second.forecast.id,
      first.forecast.id
    );

    /*
     * Same forecast identity cannot
     * silently produce another value.
     */

    let predictionConflictBlocked =
      false;

    try {
      await issueForecast(
        {
          ...request,

          prediction: {
            type:
              "POINT",

            value:
              999,

            unit:
              "REALIZED_VOLATILITY",
          },
        },
        {
          transaction,
        }
      );
    } catch (error) {
      predictionConflictBlocked =
        error.message ===
        "FORECAST_KEY_PREDICTION_CONFLICT";
    }

    assert.strictEqual(
      predictionConflictBlocked,
      true
    );

    /*
     * Model cannot see information
     * after forecast issuance.
     */

    let futureInputBlocked =
      false;

    try {
      await issueForecast(
        {
          ...request,

          issuedAt:
            "2026-09-20T12:00:00.000Z",

          inputCutoffAt:
            "2026-09-20T13:00:00.000Z",
        },
        {
          transaction,
        }
      );
    } catch (error) {
      futureInputBlocked =
        error.message ===
        "FORECAST_INPUT_CUTOFF_AFTER_ISSUE_TIME";
    }

    assert.strictEqual(
      futureInputBlocked,
      true
    );

    /*
     * Target cannot start before the
     * forecast was issued.
     */

    let pastTargetBlocked =
      false;

    try {
      await issueForecast(
        {
          ...request,

          targetWindowStartAt:
            "2026-09-20T11:00:00.000Z",
        },
        {
          transaction,
        }
      );
    } catch (error) {
      pastTargetBlocked =
        error.message ===
        "FORECAST_TARGET_START_BEFORE_ISSUE_TIME";
    }

    assert.strictEqual(
      pastTargetBlocked,
      true
    );

    /*
     * Reversed/zero target windows
     * are invalid.
     */

    let invalidWindowBlocked =
      false;

    try {
      await issueForecast(
        {
          ...request,

          targetWindowEndAt:
            "2026-09-20T12:00:00.000Z",
        },
        {
          transaction,
        }
      );
    } catch (error) {
      invalidWindowBlocked =
        error.message ===
        "FORECAST_TARGET_WINDOW_INVALID";
    }

    assert.strictEqual(
      invalidWindowBlocked,
      true
    );

    /*
     * Historical walk-forward is valid:
     * dataset itself may contain rows
     * after inputCutoffAt.
     */

    assert.ok(
      new Date(
        first
          .forecast
          .inputCutoffAt
      ).getTime() <=
      new Date(
        first
          .forecast
          .issuedAt
      ).getTime()
    );

    console.log(
      "Forecast issuance test passed."
    );

    console.log({
      forecastId:
        first.forecast.id,

      forecastKey:
        first
          .forecast
          .forecastKey,

      createdFirst:
        first.created,

      createdSecond:
        second.created,

      modelChecksum:
        first
          .forecast
          .modelChecksum,

      inputCutoffAt:
        first
          .forecast
          .inputCutoffAt,

      issuedAt:
        first
          .forecast
          .issuedAt,

      targetWindowStartAt:
        first
          .forecast
          .targetWindowStartAt,

      targetWindowEndAt:
        first
          .forecast
          .targetWindowEndAt,

      predictionConflictBlocked,

      futureInputBlocked,

      pastTargetBlocked,

      invalidWindowBlocked,
    });
  } catch (error) {
    console.error(
      "Forecast issuance test failed:",
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