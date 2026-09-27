const assert = require(
  "assert"
);

const sequelize = require(
  "../src/config/database"
);

const {
  getForecastComparisonInference,
} = require(
  "../src/modules/forecasting/services/getForecastComparisonInference.service"
);

const CANDIDATE_RUN_ID =
  process.argv[2];

const BENCHMARK_RUN_ID =
  process.argv[3];

const HORIZONS = [
  "1h",
  "6h",
  "1d",
  "3d",
  "5d",
];

const EXPECTED_HAC_LAGS = {
  "1h":
    1,

  "6h":
    1,

  "1d":
    1,

  "3d":
    2,

  "5d":
    4,
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
      await getForecastComparisonInference({
        candidateForecastRunId:
          CANDIDATE_RUN_ID,

        benchmarkForecastRunId:
          BENCHMARK_RUN_ID,
      });

    assert.strictEqual(
      result
        .commonIssueCount,
      90
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

      assert.strictEqual(
        item
          .pairedCount,
        90
      );

      assert.strictEqual(
        item
          .hacLag,
        EXPECTED_HAC_LAGS[
          horizon
        ]
      );

      assert.strictEqual(
        item
          .qlike
          .hac
          .sampleSize,
        90
      );

      assert.strictEqual(
        item
          .qlike
          .bootstrap
          .config
          .blockSize,
        7
      );

      assert.ok(
        Number.isFinite(
          item
            .qlike
            .hac
            .meanDifference
        )
      );

      assert.ok(
        Number.isFinite(
          item
            .qlike
            .hac
            .pValueTwoSided
        )
      );

      assert.ok(
        Number.isFinite(
          item
            .qlike
            .bootstrap
            .confidenceInterval
            .lower
        )
      );

      assert.ok(
        Number.isFinite(
          item
            .qlike
            .bootstrap
            .confidenceInterval
            .upper
        )
      );
    }

    console.log(
      "Forecast comparison inference test passed."
    );

    console.table(
      HORIZONS.map(
        (horizon) => {
          const item =
            result
              .horizons[
                horizon
              ];

          return {
            horizon,

            n:
              item
                .pairedCount,

            hacLag:
              item.hacLag,

            maeAdvantage:
              item
                .absoluteError
                .observedMeanAdvantage,

            maeHacP:
              item
                .absoluteError
                .hac
                .pValueTwoSided,

            maeStatus:
              item
                .absoluteError
                .supportStatus,

            qlikeAdvantage:
              item
                .qlike
                .observedMeanAdvantage,

            qlikeHacP:
              item
                .qlike
                .hac
                .pValueTwoSided,

            qlikeCandidateP:
              item
                .qlike
                .hac
                .pValueCandidateBetter,

            qlikeBootLower:
              item
                .qlike
                .bootstrap
                .confidenceInterval
                .lower,

            qlikeBootUpper:
              item
                .qlike
                .bootstrap
                .confidenceInterval
                .upper,

            qlikeProbabilityPositive:
              item
                .qlike
                .bootstrap
                .probabilityPositive,

            qlikeStatus:
              item
                .qlike
                .supportStatus,
          };
        }
      )
    );
  } catch (error) {
    console.error(
      "Forecast comparison inference test failed:",
      error
    );

    process.exitCode =
      1;
  } finally {
    await sequelize.close();
  }
};

run();