const crypto = require(
  "crypto"
);

const {
  findDatasetById,
} = require(
  "../../datasets/repositories/dataset.repository"
);

const {
  buildLogReturnSeries,
} = require(
  "../series/buildLogReturnSeries"
);

const {
  buildCalendarVolatilityMatrix,
} = require(
  "../matrix/buildCalendarVolatilityMatrix"
);

const {
  calculateCategoricalTargetProfile,
  compareCategoricalProfiles,
} = require(
  "../calculations/factors/calculateCategoricalTargetProfile"
);

const {
  createAnalysisRun,
} = require(
  "../runs/analysisRun.repository"
);

const {
  CALENDAR_HOUR_VOLATILITY_V1,
} = require(
  "../protocols/calendarHourVolatilityV1"
);

const {
  createAppError,
} = require(
  "../../../errors/appError"
);

const ENGINE_VERSION =
  "research-v1.4";

const ONE_HOUR_MS =
  60 * 60 * 1000;

const hashObject = (
  value
) =>
  crypto
    .createHash("sha256")
    .update(
      JSON.stringify(value)
    )
    .digest("hex");

const validateDataset = (
  dataset
) => {
  if (
    dataset.stage !==
    "PREPARED"
  ) {
    throw createAppError({
      statusCode: 400,
      code:
        "INVALID_RESEARCH_DATASET_STAGE",
      message:
        "Research requires a PREPARED dataset",
    });
  }

  if (
    dataset.sourceTimeframe !==
    "1h"
  ) {
    throw createAppError({
      statusCode: 400,
      code:
        "INVALID_RESEARCH_TIMEFRAME",
      message:
        "Calendar hour protocol requires 1h data",
    });
  }

  if (
    ![
      "PASS",
      "ACCEPTABLE_WITH_WARNINGS",
    ].includes(
      dataset.qualityStatus
    )
  ) {
    throw createAppError({
      statusCode: 400,
      code:
        "RESEARCH_DATASET_BLOCKED",
      message:
        "Dataset must pass quality validation",
    });
  }
};

const summarizeProfile = (
  profile
) => {
  if (
    !Array.isArray(profile) ||
    profile.length === 0
  ) {
    return null;
  }

  let minimum =
    profile[0];

  let maximum =
    profile[0];

  for (
    const item of profile
  ) {
    if (
      item.ratioToOverallMean <
      minimum.ratioToOverallMean
    ) {
      minimum = item;
    }

    if (
      item.ratioToOverallMean >
      maximum.ratioToOverallMean
    ) {
      maximum = item;
    }
  }

  return {
    minimumHour:
      minimum.category,

    minimumRatio:
      minimum.ratioToOverallMean,

    maximumHour:
      maximum.category,

    maximumRatio:
      maximum.ratioToOverallMean,

    ratioSpan:
      maximum.ratioToOverallMean -
      minimum.ratioToOverallMean,
  };
};

const buildPeriodProfile = (
  rows
) => {
  const result =
    calculateCategoricalTargetProfile({
      rows,

      categoryField:
        "calendarHourUtc",

      targetField:
        "futureRealizedVolatility",
    });

  return {
    rowCount:
      rows.length,

    overall:
      result.overall,

    profile:
      result.profile,

    summary:
      summarizeProfile(
        result.profile
      ),
  };
};

const runCalendarHourMultiHorizonResearch =
  async ({
    datasetId,
  }) => {
    const dataset =
      await findDatasetById(
        datasetId
      );

    if (!dataset) {
      throw createAppError({
        statusCode: 404,
        code:
          "DATASET_NOT_FOUND",
        message:
          `Dataset ${datasetId} not found`,
      });
    }

    validateDataset(
      dataset
    );

    const protocol =
      CALENDAR_HOUR_VOLATILITY_V1;

    const returns =
      await buildLogReturnSeries({
        filePath:
          dataset.storageUri,

        timeframe:
          dataset.sourceTimeframe,

        incompletePolicy:
          protocol
            .incompletePolicy,
      });

    const developmentEnd =
      Date.parse(
        protocol
          .development
          .end
      );

    const validationStart =
      Date.parse(
        protocol
          .retrospectiveValidation
          .start
      );

    const horizons = [];

    for (
      const horizon of
      protocol.horizons
    ) {
      const matrix =
        buildCalendarVolatilityMatrix({
          returnSeries:
            returns.series,

          horizonBars:
            horizon.bars,

          expectedIntervalMs:
            ONE_HOUR_MS,
        });

      const developmentRows =
        matrix.filter(
          (row) =>
            Date.parse(
              row.timestamp
            ) <=
              developmentEnd &&
            Date.parse(
              row.targetEndTimestamp
            ) <=
              developmentEnd
        );

      const validationRows =
        matrix.filter(
          (row) =>
            Date.parse(
              row.timestamp
            ) >=
            validationStart
        );

      const development =
        buildPeriodProfile(
          developmentRows
        );

      const validation =
        buildPeriodProfile(
          validationRows
        );

      const stability =
        compareCategoricalProfiles({
          first:
            development.profile,

          second:
            validation.profile,
        });

      horizons.push({
        horizon:
          horizon.label,

        horizonBars:
          horizon.bars,

        matrixRows:
          matrix.length,

        development,

        retrospectiveValidation:
          validation,

        stability: {
          categoryCount:
            stability.categoryCount,

          profileCorrelation:
            stability
              .meanProfileCorrelation,
        },
      });
    }

    const protocolChecksum =
      hashObject(
        protocol
      );

    const metrics = {
      sample: {
        inputRowCount:
          returns.inputRowCount,

        returnCount:
          returns.returnCount,

        skippedIncompleteCount:
          returns
            .skippedIncompleteCount,

        skippedGapReturnCount:
          returns
            .skippedGapReturnCount,
      },

      horizons,

      forwardOos: {
        status:
          protocol
            .forwardOosStatus,
      },
    };

    const run =
      await createAnalysisRun({
        datasetId:
          dataset.id,

        runType:
          "CALENDAR_HOUR_MULTI_HORIZON_FUTURE_RV",

        engineVersion:
          ENGINE_VERSION,

        config: {
          instrument:
            dataset.instrument,

          venue:
            dataset.venue,

          timeframe:
            dataset.sourceTimeframe,

          datasetChecksum:
            dataset.checksum,

          protocol,
          protocolChecksum,

          validationMode:
            "RETROSPECTIVE_HOLDOUT",
        },

        metrics,
      });

    return {
      analysisRunId:
        run.id,

      datasetId:
        dataset.id,

      engineVersion:
        ENGINE_VERSION,

      protocolId:
        protocol.id,

      protocolVersion:
        protocol.version,

      protocolChecksum,

      metrics,
    };
  };

module.exports = {
  runCalendarHourMultiHorizonResearch,
};