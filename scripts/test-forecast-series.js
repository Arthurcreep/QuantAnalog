const assert = require(
  "assert"
);

const sequelize = require(
  "../src/config/database"
);

const {
  getForecastSeries,
} = require(
  "../src/modules/forecasting/services/getForecastSeries.service"
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
      await getForecastSeries({
        forecastRunId:
          FORECAST_RUN_ID,
      });

    assert.strictEqual(
      result.model.id,
      "GARCH_NORMAL"
    );

    assert.strictEqual(
      result.model.version,
      "1.1.0"
    );

    assert.ok(
      result.runCount >=
        2
    );

    for (
      let index = 1;
      index <
        result.runs.length;
      index += 1
    ) {
      const previous =
        new Date(
          result
            .runs[
              index - 1
            ]
            .issuedAt
        ).getTime();

      const current =
        new Date(
          result
            .runs[
              index
            ]
            .issuedAt
        ).getTime();

      assert.ok(
        current >=
          previous
      );
    }

    for (
      const item of
        result.runs
    ) {
      assert.ok(
        item.horizons["1h"]
      );

      assert.ok(
        item.horizons["6h"]
      );

      assert.ok(
        item.horizons["1d"]
      );

      assert.ok(
        item.horizons["3d"]
      );

      assert.ok(
        item.horizons["5d"]
      );
    }

    console.log(
      "Forecast series test passed."
    );

    console.log({
      context:
        result.context,

      model:
        `${
          result.model.id
        }@${
          result.model.version
        }`,

      protocol:
        `${
          result.protocol.id
        }@${
          result.protocol.version
        }`,

      runCount:
        result.runCount,

      firstIssuedAt:
        result.firstIssuedAt,

      lastIssuedAt:
        result.lastIssuedAt,
    });

    console.table(
      result.runs.map(
        (item) => {
          const oneDay =
            item
              .horizons[
                "1d"
              ];

          return {
            forecastRunId:
              item
                .forecastRunId,

            issuedAt:
              item.issuedAt,

            status:
              oneDay.status,

            forecast:
              oneDay
                .prediction
                .value,

            actual:
              oneDay.actual
                ? oneDay
                    .actual
                    .value
                : null,

            absoluteError:
              oneDay.evaluation
                ? oneDay
                    .evaluation
                    .metrics
                    .volatility
                    .absoluteError
                : null,

            qlike:
              oneDay.evaluation
                ? oneDay
                    .evaluation
                    .metrics
                    .qlike
                : null,
          };
        }
      )
    );
  } catch (error) {
    console.error(
      "Forecast series test failed:",
      error
    );

    process.exitCode =
      1;
  } finally {
    await sequelize.close();
  }
};

run();