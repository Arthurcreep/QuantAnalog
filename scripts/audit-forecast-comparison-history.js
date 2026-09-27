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

const {
  getForecastRunHistory,
} = require(
  "../src/modules/forecasting/services/getForecastRunHistory.service"
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

const HORIZONS = [
  "1h",
  "6h",
  "1d",
  "3d",
  "5d",
];

const auditForecastLineage =
  async (
    series
  ) => {
    const mismatches =
      [];

    for (
      const run of
        series.runs
    ) {
      const history =
        await getForecastRunHistory({
          forecastRunId:
            run.forecastRunId,
        });

      for (
        const item of
          history.history
      ) {
        const forecastSourceAnalysisRunId =
          item
            .forecast
            .sourceAnalysisRunId ??
          null;

        const runSourceAnalysisRunId =
          run
            .sourceAnalysisRunId ??
          null;

        if (
          forecastSourceAnalysisRunId !==
          runSourceAnalysisRunId
        ) {
          mismatches.push({
            forecastRunId:
              run.forecastRunId,

            issuedAt:
              run.issuedAt,

            horizon:
              item.horizon,

            forecastId:
              item
                .forecast
                .id,

            runSourceAnalysisRunId,

            forecastSourceAnalysisRunId,
          });
        }
      }
    }

    return mismatches;
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

    const [
      candidateSeries,
      benchmarkSeries,
    ] =
      await Promise.all([
        getForecastSeries({
          forecastRunId:
            CANDIDATE_RUN_ID,
        }),

        getForecastSeries({
          forecastRunId:
            BENCHMARK_RUN_ID,
        }),
      ]);

    const comparison =
      await compareForecastSeries({
        candidateForecastRunId:
          CANDIDATE_RUN_ID,

        benchmarkForecastRunId:
          BENCHMARK_RUN_ID,
      });

    const [
      candidateMismatches,
      benchmarkMismatches,
    ] =
      await Promise.all([
        auditForecastLineage(
          candidateSeries
        ),

        auditForecastLineage(
          benchmarkSeries
        ),
      ]);

    console.log(
      "Forecast history audit complete."
    );

    console.log({
      candidate: {
        model:
          `${
            candidateSeries
              .model
              .id
          }@${
            candidateSeries
              .model
              .version
          }`,

        protocol:
          `${
            candidateSeries
              .protocol
              .id
          }@${
            candidateSeries
              .protocol
              .version
          }`,

        runCount:
          candidateSeries
            .runCount,

        lineageMismatchCount:
          candidateMismatches
            .length,
      },

      benchmark: {
        model:
          `${
            benchmarkSeries
              .model
              .id
          }@${
            benchmarkSeries
              .model
              .version
          }`,

        protocol:
          `${
            benchmarkSeries
              .protocol
              .id
          }@${
            benchmarkSeries
              .protocol
              .version
          }`,

        runCount:
          benchmarkSeries
            .runCount,

        lineageMismatchCount:
          benchmarkMismatches
            .length,
      },

      commonIssueCount:
        comparison
          .commonIssueCount,

      firstCommonIssuedAt:
        comparison
          .firstCommonIssuedAt,

      lastCommonIssuedAt:
        comparison
          .lastCommonIssuedAt,
    });

    console.table(
      HORIZONS.map(
        (horizon) => ({
          horizon,

          pairedCount:
            comparison
              .horizons[
                horizon
              ]
              .pairedCount,
        })
      )
    );

    if (
      candidateMismatches.length >
      0
    ) {
      console.log(
        "Candidate lineage mismatches:"
      );

      console.table(
        candidateMismatches
      );
    }

    if (
      benchmarkMismatches.length >
      0
    ) {
      console.log(
        "Benchmark lineage mismatches:"
      );

      console.table(
        benchmarkMismatches
      );
    }

    assert.strictEqual(
      candidateSeries
        .runCount,
      90
    );

    assert.strictEqual(
      benchmarkSeries
        .runCount,
      90
    );

    assert.strictEqual(
      candidateMismatches
        .length,
      0
    );

    assert.strictEqual(
      benchmarkMismatches
        .length,
      0
    );

    assert.strictEqual(
      comparison
        .commonIssueCount,
      90
    );

    assert.strictEqual(
      benchmarkSeries
        .protocol
        .version,
      "1.1.0"
    );

    for (
      const horizon of
        HORIZONS
    ) {
      assert.strictEqual(
        comparison
          .horizons[
            horizon
          ]
          .pairedCount,
        90
      );
    }

    console.log(
      "Canonical 90-day paired forecast history verified."
    );
  } catch (error) {
    console.error(
      "Forecast history audit failed:",
      error
    );

    process.exitCode =
      1;
  } finally {
    await sequelize.close();
  }
};

run();