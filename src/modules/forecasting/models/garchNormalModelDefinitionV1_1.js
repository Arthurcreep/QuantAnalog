const {
  GARCH_NORMAL_V1,
} = require(
  "../protocols/garchNormalV1"
);

const {
  GARCH_NORMAL_MULTI_HORIZON_V1,
} = require(
  "../protocols/garchNormalMultiHorizonV1"
);

const GARCH_NORMAL_MODEL_V1_1 =
  Object.freeze({
    id:
      "GARCH_NORMAL",

    version:
      "1.1.0",

    family:
      "GARCH",

    target:
      "FUTURE_REALIZED_VOLATILITY",

    meanModel:
      GARCH_NORMAL_V1
        .meanModel,

    distribution:
      GARCH_NORMAL_V1
        .distribution,

    oneStepVarianceEquation:
      GARCH_NORMAL_MULTI_HORIZON_V1
        .oneStepVarianceEquation,

    multiStepVarianceEquation:
      GARCH_NORMAL_MULTI_HORIZON_V1
        .multiStepVarianceEquation,

    aggregation:
      GARCH_NORMAL_MULTI_HORIZON_V1
        .aggregation,

    constraints:
      GARCH_NORMAL_V1
        .constraints,

    initialization:
      GARCH_NORMAL_V1
        .initialization,

    optimization:
      GARCH_NORMAL_V1
        .optimization,

    fitSpecification: {
      protocolId:
        GARCH_NORMAL_V1.id,

      protocolVersion:
        GARCH_NORMAL_V1
          .version,
    },
  });

module.exports = {
  GARCH_NORMAL_MODEL_V1_1,
};