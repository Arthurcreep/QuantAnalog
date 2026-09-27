const {
  BYBIT_BTCUSDT_LINEAR_VIP0_RESEARCH_V1,
} = require(
  "./bybitBtcusdtLinearVip0ResearchV1"
);

const COST_MODEL_REGISTRY = [
  {
    id:
      BYBIT_BTCUSDT_LINEAR_VIP0_RESEARCH_V1
        .id,

    version:
      BYBIT_BTCUSDT_LINEAR_VIP0_RESEARCH_V1
        .version,

    status:
      "IMPLEMENTED",

    model:
      BYBIT_BTCUSDT_LINEAR_VIP0_RESEARCH_V1,
  },
];

const getCostModel = ({
  id,
  version,
}) =>
  COST_MODEL_REGISTRY.find(
    (item) =>
      item.id ===
        id &&
      item.version ===
        version
  )?.model ||
  null;

const isCostModelImplemented = ({
  id,
  version,
}) =>
  COST_MODEL_REGISTRY.some(
    (item) =>
      item.id ===
        id &&
      item.version ===
        version &&
      item.status ===
        "IMPLEMENTED"
  );

module.exports = {
  COST_MODEL_REGISTRY,
  getCostModel,
  isCostModelImplemented,
};