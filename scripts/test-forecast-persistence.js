const assert = require(
  "assert"
);

const crypto = require(
  "crypto"
);

const sequelize = require(
  "../src/config/database"
);

const Dataset = require(
  "../src/modules/datasets/dataset.model"
);

const {
  createForecast,
  findForecastById,
} = require(
  "../src/modules/forecasting/forecasts/forecast.repository"
);

const {
  createForecastOutcome,
  findForecastOutcomeByForecastId,
} = require(
  "../src/modules/forecasting/outcomes/forecastOutcome.repository"
);

const hash = (
  value
) =>
  crypto
    .createHash(
      "sha256"
    )
    .update(
      value
    )
    .digest(
      "hex"
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

    const dataset =
      await Dataset.findByPk(
        datasetId,
        {
          transaction,
        }
      );

    assert.ok(
      dataset,
      "DATASET_NOT_FOUND"
    );

    const forecastKey =
      hash(
        [
          dataset.id,
          "HISTORICAL_VOLATILITY_BASELINE",
          "1.0.0",
          "FUTURE_REALIZED_VOLATILITY",
          "1h",
          "1h",
          "2026-09-20T12:00:00.000Z",
        ].join("|")
      );

    const modelConfig = {
      lookbackBars:
        168,

      estimator:
        "ROLLING_REALIZED_VOLATILITY",
    };

    const forecast =
      await createForecast(
        {
          datasetId:
            dataset.id,

          sourceAnalysisRunId:
            null,

          forecastKey,

          modelId:
            "HISTORICAL_VOLATILITY_BASELINE",

          modelVersion:
            "1.0.0",

          modelChecksum:
            hash(
              JSON.stringify(
                modelConfig
              )
            ),

          datasetChecksum:
            dataset.checksum,

          target:
            "FUTURE_REALIZED_VOLATILITY",

          modelTimeframe:
            "1h",

          horizon:
            "1h",

          issuedAt:
            new Date(
              "2026-09-20T12:00:00.000Z"
            ),

          inputCutoffAt:
            new Date(
              "2026-09-20T12:00:00.000Z"
            ),

          targetWindowStartAt:
            new Date(
              "2026-09-20T12:00:00.000Z"
            ),

          targetWindowEndAt:
            new Date(
              "2026-09-20T13:00:00.000Z"
            ),

          modelConfig,

          prediction: {
            type:
              "POINT",

            value:
              0.0125,

            unit:
              "REALIZED_VOLATILITY",
          },
        },
        {
          transaction,
        }
      );

    const storedForecast =
      await findForecastById(
        forecast.id,
        {
          transaction,
        }
      );

    assert.ok(
      storedForecast
    );

    assert.strictEqual(
      storedForecast
        .modelId,
      "HISTORICAL_VOLATILITY_BASELINE"
    );

    assert.strictEqual(
      storedForecast
        .target,
      "FUTURE_REALIZED_VOLATILITY"
    );

    assert.strictEqual(
      storedForecast
        .modelTimeframe,
      "1h"
    );

    assert.strictEqual(
      storedForecast
        .horizon,
      "1h"
    );

    assert.strictEqual(
      storedForecast
        .prediction
        .value,
      0.0125
    );

    /*
     * Forecast must not be mutable.
     */

    let forecastMutationBlocked =
      false;

    try {
      await storedForecast.update(
        {
          prediction: {
            type:
              "POINT",

            value:
              999,
          },
        },
        {
          transaction,
        }
      );
    } catch (error) {
      forecastMutationBlocked =
        error.message ===
        "FORECAST_IS_IMMUTABLE";
    }

    assert.strictEqual(
      forecastMutationBlocked,
      true
    );

    const outcome =
      await createForecastOutcome(
        {
          forecastId:
            forecast.id,

          actualDatasetId:
            dataset.id,

          actualDatasetChecksum:
            dataset.checksum,

          actual: {
            value:
              0.0131,

            unit:
              "REALIZED_VOLATILITY",
          },

          observedAt:
            new Date(
              "2026-09-20T13:00:00.000Z"
            ),
        },
        {
          transaction,
        }
      );

    const storedOutcome =
      await findForecastOutcomeByForecastId(
        forecast.id,
        {
          transaction,
        }
      );

    assert.ok(
      storedOutcome
    );

    assert.strictEqual(
      storedOutcome.id,
      outcome.id
    );

    assert.strictEqual(
      storedOutcome
        .actual
        .value,
      0.0131
    );

    /*
     * Outcome must also be immutable.
     */

    let outcomeMutationBlocked =
      false;

    try {
      await storedOutcome.update(
        {
          actual: {
            value:
              999,
          },
        },
        {
          transaction,
        }
      );
    } catch (error) {
      outcomeMutationBlocked =
        error.message ===
        "FORECAST_OUTCOME_IS_IMMUTABLE";
    }

    assert.strictEqual(
      outcomeMutationBlocked,
      true
    );

    /*
     * Only one outcome may exist for
     * one forecast.
     */

    let duplicateOutcomeBlocked =
      false;

    try {
      await createForecastOutcome(
        {
          forecastId:
            forecast.id,

          actualDatasetId:
            dataset.id,

          actualDatasetChecksum:
            dataset.checksum,

          actual: {
            value:
              0.02,
          },

          observedAt:
            new Date(
              "2026-09-20T14:00:00.000Z"
            ),
        },
        {
          transaction,
        }
      );
    } catch (error) {
      duplicateOutcomeBlocked =
        error?.name ===
        "SequelizeUniqueConstraintError";
    }

    assert.strictEqual(
      duplicateOutcomeBlocked,
      true
    );

    console.log(
      "Forecast persistence test passed."
    );

    console.log({
      forecastId:
        forecast.id,

      datasetId:
        forecast.datasetId,

      forecastKey:
        forecast.forecastKey,

      modelId:
        forecast.modelId,

      modelVersion:
        forecast.modelVersion,

      target:
        forecast.target,

      modelTimeframe:
        forecast.modelTimeframe,

      horizon:
        forecast.horizon,

      prediction:
        forecast.prediction,

      forecastImmutable:
        forecastMutationBlocked,

      outcomeId:
        outcome.id,

      actual:
        outcome.actual,

      outcomeImmutable:
        outcomeMutationBlocked,

      duplicateOutcomeBlocked,
    });
  } catch (error) {
    console.error(
      "Forecast persistence test failed:",
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