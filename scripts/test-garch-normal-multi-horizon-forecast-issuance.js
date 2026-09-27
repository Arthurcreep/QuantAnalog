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

const DATASET_ID =
  process.argv[2];

const ISSUED_AT =
  "2026-09-15T00:00:00.000Z";

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

    const result =
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
      result
        .forecasts
        .length,
      5
    );

    assert.strictEqual(
      result
        .modelResult
        .refit,
      true
    );

    const horizons =
      result
        .forecasts
        .map(
          (item) =>
            item.horizon
        );

    assert.deepStrictEqual(
      horizons,
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
        result.forecasts
    ) {
      assert.ok(
        item.forecast.id
      );

      assert.strictEqual(
        item.forecast.modelId,
        "GARCH_NORMAL"
      );

      assert.strictEqual(
        item.forecast.modelVersion,
        "1.1.0"
      );

      assert.strictEqual(
        item.forecast.target,
        "FUTURE_REALIZED_VOLATILITY"
      );

      assert.strictEqual(
        item.forecast.modelTimeframe,
        "1h"
      );

      assert.ok(
        Number.isFinite(
          Number(
            item
              .forecast
              .prediction
              .value
          )
        )
      );

      assert.ok(
        Number.isFinite(
          Number(
            item
              .forecast
              .prediction
              .varianceValue
          )
        )
      );
    }

    const oneHour =
      result.forecasts.find(
        (item) =>
          item.horizon ===
          "1h"
      );

    const fiveDays =
      result.forecasts.find(
        (item) =>
          item.horizon ===
          "5d"
      );

    assert.strictEqual(
      new Date(
        oneHour
          .forecast
          .targetWindowEndAt
      ).getTime() -
        new Date(
          oneHour
            .forecast
            .targetWindowStartAt
        ).getTime(),
      60 *
        60 *
        1000
    );

    assert.strictEqual(
      new Date(
        fiveDays
          .forecast
          .targetWindowEndAt
      ).getTime() -
        new Date(
          fiveDays
            .forecast
            .targetWindowStartAt
        ).getTime(),
      120 *
        60 *
        60 *
        1000
    );

    console.log(
      "GARCH multi-horizon forecast issuance test passed."
    );

    console.log({
      issuedAt:
        result.issuedAt,

      informationSet:
        result
          .informationSet,

      modelResult:
        result
          .modelResult,

      forecasts:
        result
          .forecasts
          .map(
            (item) => ({
              id:
                item
                  .forecast
                  .id,

              horizon:
                item.horizon,

              horizonBars:
                item
                  .horizonBars,

              created:
                item.created,

              targetWindowStartAt:
                item
                  .forecast
                  .targetWindowStartAt,

              targetWindowEndAt:
                item
                  .forecast
                  .targetWindowEndAt,

              prediction:
                item
                  .forecast
                  .prediction,
            })
          ),
    });

    await transaction.rollback();

    transaction =
      null;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    console.error(
      "GARCH multi-horizon forecast issuance test failed:",
      error
    );

    process.exitCode =
      1;
  } finally {
    await sequelize.close();
  }
};

run();