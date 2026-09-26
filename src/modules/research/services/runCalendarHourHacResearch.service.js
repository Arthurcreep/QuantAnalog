const crypto = require("crypto");

const {
  findDatasetById,
} = require("../../datasets/repositories/dataset.repository");

const {
  buildLogReturnSeries,
} = require("../series/buildLogReturnSeries");

const {
  buildCalendarVolatilityMatrix,
} = require("../matrix/buildCalendarVolatilityMatrix");

const {
  calculateCategoricalHacTest,
} = require("../calculations/factors/calculateCategoricalHacTest");

const {
  applyBenjaminiHochberg,
} = require("../calculations/applyBenjaminiHochberg");

const {
  createAnalysisRun,
} = require("../runs/analysisRun.repository");

const {
  CALENDAR_HOUR_VOLATILITY_V1,
} = require("../protocols/calendarHourVolatilityV1");

const {
  createAppError,
} = require("../../../errors/appError");

const ENGINE_VERSION = "research-v1.6";

const ONE_HOUR_MS = 60 * 60 * 1000;

const CATEGORY_COUNT = 24;

const hashObject = (value) =>
  crypto
    .createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex");

const validateDataset = (dataset) => {
  if (dataset.stage !== "PREPARED") {
    throw createAppError({
      statusCode: 400,
      code: "INVALID_RESEARCH_DATASET_STAGE",
      message: "HAC research requires a PREPARED dataset",
    });
  }

  if (dataset.sourceTimeframe !== "1h") {
    throw createAppError({
      statusCode: 400,
      code: "INVALID_RESEARCH_TIMEFRAME",
      message: "Calendar-hour HAC protocol requires 1h data",
    });
  }

  if (
    ![
      "PASS",
      "ACCEPTABLE_WITH_WARNINGS",
    ].includes(dataset.qualityStatus)
  ) {
    throw createAppError({
      statusCode: 400,
      code: "RESEARCH_DATASET_BLOCKED",
      message: "Dataset quality status does not allow research",
    });
  }
};

const runPeriodTests = ({
  returnSeries,
  horizons,
  startTime = null,
  endTime = null,
  requireTargetInsideEnd = false,
}) => {
  const tests = [];

  for (const horizon of horizons) {
    const matrix =
      buildCalendarVolatilityMatrix({
        returnSeries,
        horizonBars: horizon.bars,
        expectedIntervalMs: ONE_HOUR_MS,
      });

    const rows =
      matrix.filter((row) => {
        const featureTime =
          Date.parse(row.timestamp);

        const targetEndTime =
          Date.parse(
            row.targetEndTimestamp
          );

        if (
          startTime !== null &&
          featureTime < startTime
        ) {
          return false;
        }

        if (
          endTime !== null &&
          featureTime > endTime
        ) {
          return false;
        }

        if (
          requireTargetInsideEnd &&
          endTime !== null &&
          targetEndTime > endTime
        ) {
          return false;
        }

        return true;
      });

    const hacLag =
      Math.max(
        24,
        horizon.bars
      );

    const result =
      calculateCategoricalHacTest({
        rows,
        categoryField:
          "calendarHourUtc",
        targetField:
          "futureRealizedVolatility",
        categoryCount:
          CATEGORY_COUNT,
        hacLag,
      });

    tests.push({
      horizon:
        horizon.label,

      horizonBars:
        horizon.bars,

      sampleSize:
        result.sampleSize,

      hacLag:
        result.hacLag,

      statistic:
        result.statistic,

      degreesOfFreedom:
        result.degreesOfFreedom,

      pValue:
        result.pValue,

      pValueUnderflow:
        result.pValue === 0,
    });
  }

  return applyBenjaminiHochberg(
    tests
  );
};

const runCalendarHourHacResearch =
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
        code: "DATASET_NOT_FOUND",
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
          protocol.incompletePolicy,
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

    const development =
      runPeriodTests({
        returnSeries:
          returns.series,

        horizons:
          protocol.horizons,

        endTime:
          developmentEnd,

        requireTargetInsideEnd:
          true,
      });

    const retrospectiveValidation =
      runPeriodTests({
        returnSeries:
          returns.series,

        horizons:
          protocol.horizons,

        startTime:
          validationStart,
      });

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

      development,

      retrospectiveValidation,

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
          "CALENDAR_HOUR_HAC_MULTI_HORIZON",

        engineVersion:
          ENGINE_VERSION,

        config: {
          instrument:
            dataset.instrument,

          venue:
            dataset.venue,

          timeframe:
            dataset.sourceTimeframe,

          feature:
            protocol.feature,

          target:
            protocol.target,

          datasetChecksum:
            dataset.checksum,

          protocol,
          protocolChecksum,

          hac: {
            estimator:
              "NEWEY_WEST",

            kernel:
              "BARTLETT",

            lagPolicy:
              "MAX_24_OR_HORIZON_BARS",
          },

          multipleTesting: {
            method:
              "BENJAMINI_HOCHBERG",

            scope:
              "FIVE_PREDEFINED_HORIZONS_WITHIN_EACH_PERIOD",

            horizons:
              protocol
                .horizons
                .map(
                  (item) =>
                    item.label
                ),
          },

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
  runCalendarHourHacResearch,
};