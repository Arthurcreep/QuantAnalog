const assert = require(
  "assert"
);

const sequelize = require(
  "../src/config/database"
);

const {
  getForecastComparisonPerformance,
} = require(
  "../src/modules/forecasting/services/getForecastComparisonPerformance.service"
);

const CANDIDATE_RUN_ID =
  process.argv[2];

const BENCHMARK_RUN_ID =
  process.argv[3];

const ROLLING_WINDOW =
  30;

const HORIZONS = [
  "1h",
  "6h",
  "1d",
  "3d",
  "5d",
];

const assertFinite = (
  value,
  label
) => {
  assert.ok(
    Number.isFinite(
      value
    ),
    `${label} must be finite`
  );
};

const run = async () => {
  try {
    if (
      !CANDIDATE_RUN_ID ||
      !BENCHMARK_RUN_ID
    ) {
      throw new Error(
        "CANDIDATE_AND_BENCHMARK_RUN_IDS_REQUIRED"
      );
    }

    await sequelize.authenticate();

    const result =
      await getForecastComparisonPerformance({
        candidateForecastRunId:
          CANDIDATE_RUN_ID,

        benchmarkForecastRunId:
          BENCHMARK_RUN_ID,

        rollingWindow:
          ROLLING_WINDOW,
      });

    assert.strictEqual(
      result
        .commonIssueCount,
      90
    );

    assert.strictEqual(
      result
        .rollingWindow,
      30
    );

    assert.strictEqual(
      result
        .rollingBasis,
      "PAIRED_EVALUATED_FORECASTS"
    );

    for (
      const horizon of
        HORIZONS
    ) {
      const item =
        result
          .horizons[
            horizon
          ];

      assert.ok(
        item
      );

      assert.strictEqual(
        item
          .pairedCount,
        90
      );

      /*
       * 90 observations with a
       * 30-observation full window:
       *
       * 90 - 30 + 1 = 61
       */
      assert.strictEqual(
        item
          .rollingPointCount,
        61
      );

      const aggregate =
        item.aggregate;

      assertFinite(
        aggregate
          .absoluteError
          .meanAdvantage,
        `${horizon} aggregate MAE advantage`
      );

      assertFinite(
        aggregate
          .qlike
          .meanAdvantage,
        `${horizon} aggregate QLIKE advantage`
      );

      const latest =
        item
          .rolling
          .at(-1);

      assert.ok(
        latest
      );

      assert.strictEqual(
        latest
          .observationCount,
        30
      );

      assertFinite(
        latest
          .absoluteError
          .meanAdvantage,
        `${horizon} rolling MAE advantage`
      );

      assertFinite(
        latest
          .qlike
          .meanAdvantage,
        `${horizon} rolling QLIKE advantage`
      );
    }

    console.log(
      "Forecast comparison performance test passed."
    );

    console.log({
      candidate:
        `${
          result
            .candidate
            .model
            .id
        }@${
          result
            .candidate
            .model
            .version
        }`,

      benchmark:
        `${
          result
            .benchmark
            .model
            .id
        }@${
          result
            .benchmark
            .model
            .version
        }`,

      commonIssueCount:
        result
          .commonIssueCount,

      rollingWindow:
        result
          .rollingWindow,

      rollingPointCount:
        result
          .horizons[
            "1h"
          ]
          .rollingPointCount,
    });

    console.table(
      HORIZONS.map(
        (horizon) => {
          const item =
            result
              .horizons[
                horizon
              ];

          const latest =
            item
              .rolling
              .at(-1);

          return {
            horizon,

            n:
              item
                .pairedCount,

            aggregateMaeAdvantage:
              item
                .aggregate
                .absoluteError
                .meanAdvantage,

            aggregateQlikeAdvantage:
              item
                .aggregate
                .qlike
                .meanAdvantage,

            aggregateQlikeWinRate:
              item
                .aggregate
                .qlike
                .candidateWinRate,

            rolling30MaeAdvantage:
              latest
                .absoluteError
                .meanAdvantage,

            rolling30QlikeAdvantage:
              latest
                .qlike
                .meanAdvantage,

            rolling30QlikeWinRate:
              latest
                .qlike
                .candidateWinRate,
          };
        }
      )
    );
  } catch (error) {
    console.error(
      "Forecast comparison performance test failed:",
      error
    );

    process.exitCode =
      1;
  } finally {
    await sequelize.close();
  }
};

run();