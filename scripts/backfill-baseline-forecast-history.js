const sequelize = require(
  "../src/config/database"
);

const {
  runHistoricalVolatilityMultiHorizonForecast,
} = require(
  "../src/modules/forecasting/services/runHistoricalVolatilityMultiHorizonForecast.service"
);

const DATASET_ID =
  "f10885c8-f99e-494e-9ad4-fc0f5c385f26";

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
      "INVALID_BASELINE_BACKFILL_RANGE"
    );
  }

  const dates =
    [];

  for (
    let timestamp =
      startMs;
    timestamp <=
      endMs;
    timestamp +=
      DAY_MS
  ) {
    dates.push(
      new Date(
        timestamp
      ).toISOString()
    );
  }

  return dates;
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

    let createdRuns =
      0;

    let reusedRuns =
      0;

    let createdForecasts =
      0;

    let reusedForecasts =
      0;

    let anchorRunId =
      null;

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

      const result =
        await runHistoricalVolatilityMultiHorizonForecast({
          datasetId:
            DATASET_ID,

          issuedAt,

          sourceAnalysisRunId:
            null,
        });

      if (
        anchorRunId ===
        null
      ) {
        anchorRunId =
          result
            .forecastRun
            .run
            .id;
      }

      if (
        result
          .forecastRun
          .created
      ) {
        createdRuns +=
          1;
      } else {
        reusedRuns +=
          1;
      }

      for (
        const item of
          result.forecasts
      ) {
        if (
          item.created
        ) {
          createdForecasts +=
            1;
        } else {
          reusedForecasts +=
            1;
        }
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
          `Baseline history progress: ${completed}/${issueDates.length}`
        );
      }
    }

    console.log(
      "Baseline forecast history backfill complete."
    );

    console.log({
      protocol:
        "HISTORICAL_VOLATILITY_BASELINE_MULTI_HORIZON_V1@1.1.0",

      issueCount:
        issueDates.length,

      firstIssuedAt:
        issueDates[0],

      lastIssuedAt:
        issueDates[
          issueDates.length -
          1
        ],

      createdRuns,

      reusedRuns,

      createdForecasts,

      reusedForecasts,

      anchorRunId,
    });
  } catch (error) {
    console.error(
      "Baseline forecast history backfill failed:",
      error
    );

    process.exitCode =
      1;
  } finally {
    await sequelize.close();
  }
};

run();