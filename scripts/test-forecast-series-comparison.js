const assert = require(
  "assert"
);

const sequelize = require(
  "../src/config/database"
);

const {
  compareForecastSeries,
} = require(
  "../src/modules/forecasting/services/compareForecastSeries.service"
);

const CANDIDATE_RUN_ID =
  process.argv[2];

const BENCHMARK_RUN_ID =
  process.argv[3];

const run = async () => {
  try {
    if (
      !CANDIDATE_RUN_ID
    ) {
      throw new Error(
        "CANDIDATE_RUN_ID_REQUIRED"
      );
    }

    if (
      !BENCHMARK_RUN_ID
    ) {
      throw new Error(
        "BENCHMARK_RUN_ID_REQUIRED"
      );
    }

    await sequelize.authenticate();

    const result =
      await compareForecastSeries({
        candidateForecastRunId:
          CANDIDATE_RUN_ID,

        benchmarkForecastRunId:
          BENCHMARK_RUN_ID,
      });

    assert.strictEqual(
      result
        .candidate
        .model
        .id,
      "GARCH_NORMAL"
    );

    assert.strictEqual(
      result
        .benchmark
        .model
        .id,
      "HISTORICAL_VOLATILITY_BASELINE"
    );

    assert.strictEqual(
      result.commonIssueCount,
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
      const comparison =
        result
          .horizons[
            horizon
          ];

      assert.ok(
        comparison
      );

      assert.strictEqual(
        comparison
          .pairedCount,
        2
      );

      assert.ok(
        Number.isFinite(
          comparison
            .absoluteError
            .meanAdvantage
        )
      );

      assert.ok(
        Number.isFinite(
          comparison
            .squaredError
            .meanAdvantage
        )
      );

      assert.ok(
        Number.isFinite(
          comparison
            .qlike
            .meanAdvantage
        )
      );
    }

    console.log(
      "Forecast series comparison test passed."
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
        result.commonIssueCount,

      firstCommonIssuedAt:
        result.firstCommonIssuedAt,

      lastCommonIssuedAt:
        result.lastCommonIssuedAt,
    });

    console.table(
      Object.values(
        result.horizons
      ).map(
        (item) => ({
          horizon:
            item.horizon,

          n:
            item.pairedCount,

          candidateMAE:
            item
              .absoluteError
              .candidateMean,

          baselineMAE:
            item
              .absoluteError
              .benchmarkMean,

          maeAdvantage:
            item
              .absoluteError
              .meanAdvantage,

          candidateQLIKE:
            item
              .qlike
              .candidateMean,

          baselineQLIKE:
            item
              .qlike
              .benchmarkMean,

          qlikeAdvantage:
            item
              .qlike
              .meanAdvantage,

          qlikeWins:
            item
              .qlike
              .candidateBetterCount,
        })
      )
    );
  } catch (error) {
    console.error(
      "Forecast series comparison test failed:",
      error
    );

    process.exitCode =
      1;
  } finally {
    await sequelize.close();
  }
};

run();