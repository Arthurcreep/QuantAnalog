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

    const first =
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
      first
        .forecastRun
        .created,
      true
    );

    assert.strictEqual(
      first.forecasts.length,
      5
    );

    for (
      const item of
        first.forecasts
    ) {
      assert.strictEqual(
        item.created,
        true
      );

      assert.strictEqual(
        item.runItemCreated,
        true
      );

      assert.strictEqual(
        item
          .runItem
          .forecastRunId,
        first
          .forecastRun
          .run
          .id
      );

      assert.strictEqual(
        item
          .runItem
          .forecastId,
        item
          .forecast
          .id
      );
    }

    const second =
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
      second
        .forecastRun
        .created,
      false
    );

    assert.strictEqual(
      second
        .forecastRun
        .run
        .id,
      first
        .forecastRun
        .run
        .id
    );

    assert.strictEqual(
      second.forecasts.length,
      5
    );

    for (
      let index = 0;
      index <
        second.forecasts.length;
      index += 1
    ) {
      const firstItem =
        first.forecasts[
          index
        ];

      const secondItem =
        second.forecasts[
          index
        ];

      assert.strictEqual(
        secondItem.created,
        false
      );

      assert.strictEqual(
        secondItem
          .runItemCreated,
        false
      );

      assert.strictEqual(
        secondItem
          .forecast
          .id,
        firstItem
          .forecast
          .id
      );

      assert.strictEqual(
        secondItem
          .runItem
          .id,
        firstItem
          .runItem
          .id
      );
    }

    assert.notStrictEqual(
      first
        .model
        .checksum,
      first
        .model
        .protocolChecksum
    );

    console.log(
      "GARCH ForecastRun test passed."
    );

    console.log({
      forecastRunId:
        first
          .forecastRun
          .run
          .id,

      runKey:
        first
          .forecastRun
          .run
          .runKey,

      model:
        `${
          first.model.id
        }@${
          first.model.version
        }`,

      modelChecksum:
        first
          .model
          .checksum,

      protocol:
        `${
          first.model.protocolId
        }@${
          first.model.protocolVersion
        }`,

      protocolChecksum:
        first
          .model
          .protocolChecksum,

      firstRun: {
        runCreated:
          first
            .forecastRun
            .created,

        forecastsCreated:
          first
            .forecasts
            .map(
              (item) =>
                item.created
            ),

        runItemsCreated:
          first
            .forecasts
            .map(
              (item) =>
                item
                  .runItemCreated
            ),
      },

      secondRun: {
        runCreated:
          second
            .forecastRun
            .created,

        forecastsCreated:
          second
            .forecasts
            .map(
              (item) =>
                item.created
            ),

        runItemsCreated:
          second
            .forecasts
            .map(
              (item) =>
                item
                  .runItemCreated
            ),
      },
    });

    console.table(
      first
        .forecasts
        .map(
          (item) => ({
            position:
              item
                .runItem
                .position,

            horizon:
              item.horizon,

            horizonBars:
              item
                .horizonBars,

            forecastId:
              item
                .forecast
                .id,

            runItemId:
              item
                .runItem
                .id,
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
      "GARCH ForecastRun test failed:",
      error
    );

    process.exitCode =
      1;
  } finally {
    await sequelize.close();
  }
};

run();