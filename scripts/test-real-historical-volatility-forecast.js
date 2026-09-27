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

const ONE_HOUR_MS =
  60 * 60 * 1000;

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

    const issuedAt =
      "2026-09-20T13:00:00.000Z";

    const first =
      await runHistoricalVolatilityForecast(
        {
          datasetId,

          issuedAt,

          lookbackBars:
            168,

          horizonBars:
            1,
        },
        {
          transaction,
        }
      );

    const second =
      await runHistoricalVolatilityForecast(
        {
          datasetId,

          issuedAt,

          lookbackBars:
            168,

          horizonBars:
            1,
        },
        {
          transaction,
        }
      );

    assert.strictEqual(
      first.created,
      true
    );

    assert.strictEqual(
      second.created,
      false
    );

    assert.strictEqual(
      first.forecast.id,
      second.forecast.id
    );

    assert.strictEqual(
      first.forecast.modelId,
      "HISTORICAL_VOLATILITY_BASELINE"
    );

    assert.strictEqual(
      first.forecast.modelVersion,
      "1.0.0"
    );

    assert.strictEqual(
      first.forecast.target,
      "FUTURE_REALIZED_VOLATILITY"
    );

    assert.strictEqual(
      first.forecast.modelTimeframe,
      "1h"
    );

    assert.strictEqual(
      first.forecast.horizon,
      "1h"
    );

    assert.strictEqual(
      first
        .modelResult
        .sample
        .returnCount,
      168
    );

    const lastUsedTimestamp =
      Date.parse(
        first
          .informationSet
          .lastUsedReturnTimestamp
      );

    const lastUsedAvailableAt =
      Date.parse(
        first
          .informationSet
          .lastUsedReturnAvailableAt
      );

    const issueTimestamp =
      Date.parse(
        issuedAt
      );

    /*
     * Last used 1h candle is expected
     * to start at 12:00 and become
     * available exactly at 13:00.
     */

    assert.strictEqual(
      lastUsedTimestamp +
        ONE_HOUR_MS,
      lastUsedAvailableAt
    );

    assert.ok(
      lastUsedAvailableAt <=
        issueTimestamp,
      "FORECAST_USED_FUTURE_INFORMATION"
    );

    assert.strictEqual(
      first
        .informationSet
        .lastUsedReturnTimestamp,
      "2026-09-20T12:00:00.000Z"
    );

    assert.strictEqual(
      first
        .informationSet
        .lastUsedReturnAvailableAt,
      "2026-09-20T13:00:00.000Z"
    );

    assert.strictEqual(
      new Date(
        first
          .forecast
          .targetWindowStartAt
      ).toISOString(),
      "2026-09-20T13:00:00.000Z"
    );

    assert.strictEqual(
      new Date(
        first
          .forecast
          .targetWindowEndAt
      ).toISOString(),
      "2026-09-20T14:00:00.000Z"
    );

    assert.ok(
      Number.isFinite(
        first
          .forecast
          .prediction
          .value
      )
    );

    assert.ok(
      first
        .forecast
        .prediction
        .value >=
        0
    );

    assert.ok(
      Number.isFinite(
        first
          .forecast
          .prediction
          .varianceValue
      )
    );

    /*
     * Forecast times for this first
     * vertical slice must be aligned
     * to the 1h model timeframe.
     */

    let unalignedIssueBlocked =
      false;

    try {
      await runHistoricalVolatilityForecast(
        {
          datasetId,

          issuedAt:
            "2026-09-20T13:30:00.000Z",

          lookbackBars:
            168,

          horizonBars:
            1,
        },
        {
          transaction,
        }
      );
    } catch (error) {
      unalignedIssueBlocked =
        error.message ===
        "FORECAST_ISSUE_TIME_NOT_ALIGNED";
    }

    assert.strictEqual(
      unalignedIssueBlocked,
      true
    );

    console.log(
      "Real historical volatility forecast test passed."
    );

    console.log({
      forecastId:
        first.forecast.id,

      forecastKey:
        first
          .forecast
          .forecastKey,

      datasetId:
        first.forecast.datasetId,

      model:
        `${first.forecast.modelId}@${first.forecast.modelVersion}`,

      modelTimeframe:
        first
          .forecast
          .modelTimeframe,

      horizon:
        first
          .forecast
          .horizon,

      issuedAt:
        new Date(
          first
            .forecast
            .issuedAt
        ).toISOString(),

      lastUsedReturnTimestamp:
        first
          .informationSet
          .lastUsedReturnTimestamp,

      lastUsedReturnAvailableAt:
        first
          .informationSet
          .lastUsedReturnAvailableAt,

      lookbackBars:
        first
          .informationSet
          .lookbackBars,

      historicalVariance:
        first
          .modelResult
          .historical
          .realizedVariance,

      variancePerBar:
        first
          .modelResult
          .historical
          .variancePerBar,

      forecastVariance:
        first
          .forecast
          .prediction
          .varianceValue,

      forecastVolatility:
        first
          .forecast
          .prediction
          .value,

      targetWindowStartAt:
        new Date(
          first
            .forecast
            .targetWindowStartAt
        ).toISOString(),

      targetWindowEndAt:
        new Date(
          first
            .forecast
            .targetWindowEndAt
        ).toISOString(),

      createdFirst:
        first.created,

      createdSecond:
        second.created,

      unalignedIssueBlocked,
    });
  } catch (error) {
    console.error(
      "Real historical volatility forecast test failed:",
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