const sequelize = require(
  "../src/config/database"
);

const {
  runVolatilityStructureResearch,
} = require(
  "../src/modules/research/services/runVolatilityStructureResearch.service"
);

const DATASETS = [
  {
    timeframe: "5m",
    datasetId:
      "7e6def5c-ea04-46cf-b7aa-f06b3102d0a3",
  },
  {
    timeframe: "15m",
    datasetId:
      "dd79a94f-898a-4c28-a7ac-dd477b72976c",
  },
  {
    timeframe: "1h",
    datasetId:
      "f10885c8-f99e-494e-9ad4-fc0f5c385f26",
  },
  {
    timeframe: "4h",
    datasetId:
      "da08ebbc-9e71-47ad-99e6-117b88deeb3f",
  },
  {
    timeframe: "1d",
    datasetId:
      "1b40b756-002a-4abb-89c4-44ae395af1d8",
  },
];

const findLag = (
  values,
  lag
) =>
  values.find(
    (item) =>
      item.lag === lag
  )?.value ?? null;

const findArchLm = (
  values,
  lags
) =>
  values.find(
    (item) =>
      item.lags === lags
  ) ?? null;

const buildSummary = ({
  timeframe,
  result,
}) => {
  const development =
    result.metrics.development;

  const validation =
    result.metrics
      .retrospectiveValidation;

  const devArch10 =
    findArchLm(
      development.archLm,
      10
    );

  const validationArch10 =
    findArchLm(
      validation.archLm,
      10
    );

  return {
    timeframe,

    totalReturns:
      result.metrics
        .sample
        .returnCount,

    devN:
      development.sampleSize,

    validationN:
      validation.sampleSize,

    devAbsAcf1:
      findLag(
        development
          .acf
          .absoluteReturns,
        1
      ),

    validationAbsAcf1:
      findLag(
        validation
          .acf
          .absoluteReturns,
        1
      ),

    devSquaredAcf1:
      findLag(
        development
          .acf
          .squaredReturns,
        1
      ),

    validationSquaredAcf1:
      findLag(
        validation
          .acf
          .squaredReturns,
        1
      ),

    devArchR2_10:
      devArch10
        ?.rSquared ?? null,

    validationArchR2_10:
      validationArch10
        ?.rSquared ?? null,

    analysisRunId:
      result.analysisRunId,
  };
};

const run = async () => {
  try {
    await sequelize.authenticate();

    const summaries = [];

    for (
      const dataset of
      DATASETS
    ) {
      console.log(
        `\n[RESEARCH] BTCUSDT ${dataset.timeframe}`
      );

      const startedAt =
        Date.now();

      const result =
        await runVolatilityStructureResearch({
          datasetId:
            dataset.datasetId,
        });

      const summary =
        buildSummary({
          timeframe:
            dataset.timeframe,

          result,
        });

      summaries.push(
        summary
      );

      console.log({
        timeframe:
          dataset.timeframe,

        returnCount:
          summary.totalReturns,

        developmentN:
          summary.devN,

        validationN:
          summary.validationN,

        seconds:
          (
            (
              Date.now() -
              startedAt
            ) /
            1000
          ).toFixed(2),

        analysisRunId:
          summary.analysisRunId,
      });
    }

    console.log(
      "\n===== BTCUSDT MULTI-TIMEFRAME VOLATILITY ====="
    );

    console.table(
      summaries.map(
        (item) => ({
          TF:
            item.timeframe,

          N:
            item.totalReturns,

          "DEV |r| ACF1":
            item.devAbsAcf1,

          "VAL |r| ACF1":
            item
              .validationAbsAcf1,

          "DEV r² ACF1":
            item
              .devSquaredAcf1,

          "VAL r² ACF1":
            item
              .validationSquaredAcf1,

          "DEV ARCH R²":
            item
              .devArchR2_10,

          "VAL ARCH R²":
            item
              .validationArchR2_10,
        })
      )
    );

    console.log(
      "\nBTCUSDT multi-timeframe volatility protocol completed"
    );
  } catch (error) {
    console.error(
      "BTCUSDT multi-timeframe volatility protocol failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();