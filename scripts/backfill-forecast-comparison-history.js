const sequelize = require(
  "../src/config/database"
);

const {
  runGarchNormalMultiHorizonForecast,
} = require(
  "../src/modules/forecasting/services/runGarchNormalMultiHorizonForecast.service"
);

const {
  runHistoricalVolatilityMultiHorizonForecast,
} = require(
  "../src/modules/forecasting/services/runHistoricalVolatilityMultiHorizonForecast.service"
);

const DATASET_ID =
  "f10885c8-f99e-494e-9ad4-fc0f5c385f26";

const GARCH_ANALYSIS_RUN_ID =
  "828053be-6334-4475-a18b-a837439c8161";

const START_AT =
  "2026-06-19T00:00:00.000Z";

const END_AT =
  "2026-09-16T00:00:00.000Z";

const DAY_MS =
  24 *
  60 *
  60 *
  1000;

const buildIssueDates = ({
  startAt,
  endAt,
}) => {
  const startMs =
    new Date(
      startAt
    ).getTime();

  const endMs =
    new Date(
      endAt
    ).getTime();

  if (
    !Number.isFinite(
      startMs
    ) ||
    !Number.isFinite(
      endMs
    ) ||
    startMs >
      endMs
  ) {
    throw new Error(
      "INVALID_FORECAST_HISTORY_RANGE"
    );
  }

  const issueDates =
    [];

  for (
    let timestampMs =
      startMs;
    timestampMs <=
      endMs;
    timestampMs +=
      DAY_MS
  ) {
    issueDates.push(
      new Date(
        timestampMs
      ).toISOString()
    );
  }

  return issueDates;
};

const run = async () => {
  try {
    await sequelize.authenticate();

    const issueDates =
      buildIssueDates({
        startAt:
          START_AT,

        endAt:
          END_AT,
      });

    if (
      issueDates.length !==
      90
    ) {
      throw new Error(
        `EXPECTED_90_ISSUE_DATES_GOT:${issueDates.length}`
      );
    }

    let candidateAnchorRunId =
      null;

    let benchmarkAnchorRunId =
      null;

    let candidateCreated =
      0;

    let candidateReused =
      0;

    let benchmarkCreated =
      0;

    let benchmarkReused =
      0;

    for (
      let index = 0;
      index <
        issueDates.length;
      index += 1
    ) {
      const issuedAt =
        issueDates[
          index
        ];

      const candidate =
        await runGarchNormalMultiHorizonForecast({
          datasetId:
            DATASET_ID,

          issuedAt,

          sourceAnalysisRunId:
            GARCH_ANALYSIS_RUN_ID,
        });

      const benchmark =
        await runHistoricalVolatilityMultiHorizonForecast({
          datasetId:
            DATASET_ID,

          issuedAt,

          /*
           * Baseline has no dedicated
           * AnalysisRun yet.
           *
           * Do not attach the GARCH
           * AnalysisRun to it.
           */
          sourceAnalysisRunId:
            null,
        });

      if (
        candidateAnchorRunId ===
        null
      ) {
        candidateAnchorRunId =
          candidate
            .forecastRun
            .run
            .id;
      }

      if (
        benchmarkAnchorRunId ===
        null
      ) {
        benchmarkAnchorRunId =
          benchmark
            .forecastRun
            .run
            .id;
      }

      if (
        candidate
          .forecastRun
          .created
      ) {
        candidateCreated +=
          1;
      } else {
        candidateReused +=
          1;
      }

      if (
        benchmark
          .forecastRun
          .created
      ) {
        benchmarkCreated +=
          1;
      } else {
        benchmarkReused +=
          1;
      }

      const completed =
        index + 1;

      if (
        completed ===
          1 ||
        completed %
          10 ===
          0 ||
        completed ===
          issueDates.length
      ) {
        console.log(
          `Forecast history progress: ${completed}/${issueDates.length}`
        );
      }
    }

    console.log(
      "Forecast comparison history backfill complete."
    );

    console.log({
      issueCount:
        issueDates.length,

      firstIssuedAt:
        issueDates[0],

      lastIssuedAt:
        issueDates[
          issueDates.length -
          1
        ],

      candidate: {
        model:
          "GARCH_NORMAL@1.1.0",

        sourceAnalysisRunId:
          GARCH_ANALYSIS_RUN_ID,

        createdRuns:
          candidateCreated,

        reusedRuns:
          candidateReused,

        anchorRunId:
          candidateAnchorRunId,
      },

      benchmark: {
        model:
          "HISTORICAL_VOLATILITY_BASELINE@1.0.0",

        sourceAnalysisRunId:
          null,

        createdRuns:
          benchmarkCreated,

        reusedRuns:
          benchmarkReused,

        anchorRunId:
          benchmarkAnchorRunId,
      },
    });
  } catch (error) {
    console.error(
      "Forecast comparison history backfill failed:",
      error
    );

    process.exitCode =
      1;
  } finally {
    await sequelize.close();
  }
};

run();