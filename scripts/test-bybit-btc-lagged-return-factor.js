const sequelize = require(
  "../src/config/database"
);

const {
  LAGGED_RETURN_FUTURE_RETURN_V1,
} = require(
  "../src/modules/research/protocols/laggedReturnFutureReturnV1"
);

const {
  runContinuousFactorResearch,
} = require(
  "../src/modules/research/services/runContinuousFactorResearch.service"
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
      "Running H_RET_001 continuous factor research..."
    );

    const result =
      await runContinuousFactorResearch({
        datasetId,

        protocol:
          LAGGED_RETURN_FUTURE_RETURN_V1,
      });

    console.log(
      "\n===== ANALYSIS RUN ====="
    );

    console.log({
      analysisRunId:
        result.analysisRunId,

      datasetId:
        result.datasetId,

      engineVersion:
        result.engineVersion,

      protocolId:
        result.protocolId,

      protocolVersion:
        result.protocolVersion,

      protocolChecksum:
        result.protocolChecksum,
    });

    console.log(
      "\n===== H_RET_001 RESULTS ====="
    );

    console.table(
      result
        .metrics
        .horizons
        .map(
          (item) => ({
            Horizon:
              item.horizon,

            DevBeta:
              item
                .evaluation
                .development
                .hac
                .beta,

            DevP:
              item
                .evaluation
                .development
                .hac
                .pValue,

            DevAdjustedP:
              item
                .multipleTesting
                .developmentAdjustedPValue,

            DevR2:
              item
                .evaluation
                .development
                .hac
                .rSquared,

            ValidationBeta:
              item
                .evaluation
                .retrospectiveValidation
                .hac
                .beta,

            ValidationP:
              item
                .evaluation
                .retrospectiveValidation
                .hac
                .pValue,

            ValidationAdjustedP:
              item
                .multipleTesting
                .validationAdjustedPValue,

            ValidationR2:
              item
                .evaluation
                .retrospectiveValidation
                .hac
                .rSquared,

            SignStable:
              item
                .evaluation
                .stability
                .signStable,
          })
        )
    );

    console.log(
      "\n===== FORWARD OOS ====="
    );

    console.log(
      result
        .metrics
        .forwardOos
    );
  } catch (error) {
    console.error(
      "H_RET_001 test failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();