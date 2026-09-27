const sequelize = require(
  "../src/config/database"
);

const {
  CURRENT_RV_FUTURE_RV_V1,
} = require(
  "../src/modules/research/protocols/currentRvFutureRvV1"
);

const {
  runContinuousFactorRobustness,
} = require(
  "../src/modules/research/services/runContinuousFactorRobustness.service"
);

const DEFAULT_DATASET_ID =
  "f10885c8-f99e-494e-9ad4-fc0f5c385f26";

const run = async () => {
  try {
    const datasetId =
      process.argv[2] ||
      DEFAULT_DATASET_ID;

    await sequelize.authenticate();

    console.log(
      "Running H_VOL_002 robustness inspection..."
    );

    const result =
      await runContinuousFactorRobustness({
        datasetId,

        factorProtocol:
          CURRENT_RV_FUTURE_RV_V1,
      });

    console.log(
      "\n===== ROBUSTNESS HEADER ====="
    );

    console.log({
      datasetId:
        result.datasetId,

      factorProtocol:
        result
          .factorProtocol,

      robustnessProtocol:
        result
          .robustnessProtocol,
    });

    console.log(
      "\n===== H_VOL_002 ROBUSTNESS ====="
    );

    console.table(
      result
        .horizons
        .map(
          (item) => ({
            Horizon:
              item.horizon,

            DevBeta:
              item
                .developmentBeta,

            BootstrapLower:
              item
                .robustness
                .bootstrap
                .beta
                .confidenceInterval
                .lower,

            BootstrapMedian:
              item
                .robustness
                .bootstrap
                .beta
                .confidenceInterval
                .median,

            BootstrapUpper:
              item
                .robustness
                .bootstrap
                .beta
                .confidenceInterval
                .upper,

            BootstrapSupported:
              item
                .robustness
                .gates
                .bootstrapSupported,

            ValidYears:
              item
                .robustness
                .yearly
                .summary
                .validYears,

            DirectionAgreement:
              item
                .robustness
                .yearly
                .summary
                .directionAgreementRatio,

            MedianYearlyBeta:
              item
                .robustness
                .yearly
                .summary
                .medianBeta,

            YearlySupported:
              item
                .robustness
                .gates
                .yearlySupported,

            RobustSupported:
              item
                .robustness
                .gates
                .robustSupported,
          })
        )
    );

    for (
      const item of
      result.horizons
    ) {
      console.log(
        `\n===== ${item.horizon} YEARLY =====`
      );

      console.table(
        item
          .robustness
          .yearly
          .yearly
          .map(
            (year) => ({
              Year:
                year.year,

              Status:
                year.status,

              N:
                year.sampleSize,

              Beta:
                year.beta,

              PValue:
                year.pValue,

              R2:
                year.rSquared,

              DirectionAgreement:
                year
                  .directionAgreement,
            })
          )
      );
    }
  } catch (error) {
    console.error(
      "H_VOL_002 robustness inspection failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();