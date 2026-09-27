const assert = require(
  "assert"
);

const sequelize = require(
  "../src/config/database"
);

const {
  getForecastPerformance,
} = require(
  "../src/modules/forecasting/services/getForecastPerformance.service"
);

const FORECAST_RUN_ID =
  process.argv[2];

const run = async () => {
  try {
    if (
      !FORECAST_RUN_ID
    ) {
      throw new Error(
        "FORECAST_RUN_ID_REQUIRED"
      );
    }

    await sequelize.authenticate();

    const result =
      await getForecastPerformance({
        forecastRunId:
          FORECAST_RUN_ID,

        rollingWindow:
          2,

        rollingMinObservations:
          2,
      });

    assert.strictEqual(
      result.model.id,
      "GARCH_NORMAL"
    );

    assert.strictEqual(
      result.runCount,
      2
    );

    for (
      const horizon of [
        "1h",
        "6h",
        "1d",
        "3d",
        "5d",
      ]
    ) {
      const performance =
        result
          .horizons[
            horizon
          ];

      assert.ok(
        performance
      );

      assert.strictEqual(
        performance
          .forecastCount,
        2
      );

      assert.strictEqual(
        performance
          .evaluatedCount,
        2
      );

      assert.strictEqual(
        performance
          .aggregate
          .observationCount,
        2
      );

      assert.ok(
        Number.isFinite(
          performance
            .aggregate
            .mae
        )
      );

      assert.ok(
        Number.isFinite(
          performance
            .aggregate
            .rmse
        )
      );

      assert.ok(
        Number.isFinite(
          performance
            .aggregate
            .bias
        )
      );

      assert.ok(
        Number.isFinite(
          performance
            .aggregate
            .meanQlike
        )
      );

      assert.strictEqual(
        performance
          .rolling
          .points
          .length,
        1
      );
    }

    console.log(
      "Forecast performance test passed."
    );

    console.log({
      model:
        `${
          result.model.id
        }@${
          result.model.version
        }`,

      runCount:
        result.runCount,

      firstIssuedAt:
        result.firstIssuedAt,

      lastIssuedAt:
        result.lastIssuedAt,

      rollingWindow:
        result.rollingWindow,
    });

    console.table(
      Object.values(
        result.horizons
      ).map(
        (item) => ({
          horizon:
            item.horizon,

          n:
            item
              .aggregate
              .observationCount,

          mae:
            item
              .aggregate
              .mae,

          rmse:
            item
              .aggregate
              .rmse,

          bias:
            item
              .aggregate
              .bias,

          meanQlike:
            item
              .aggregate
              .meanQlike,

          medianQlike:
            item
              .aggregate
              .medianQlike,

          rollingPoints:
            item
              .rolling
              .points
              .length,
        })
      )
    );
  } catch (error) {
    console.error(
      "Forecast performance test failed:",
      error
    );

    process.exitCode =
      1;
  } finally {
    await sequelize.close();
  }
};

run();