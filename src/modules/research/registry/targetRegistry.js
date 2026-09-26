const TARGETS = [
  {
    id: "FUTURE_LOG_RETURN",
    family: "RETURN",
    version: "1.0.0",
    status: "PLANNED",

    parameters: [
      "horizon",
    ],

    description:
      "Future logarithmic return over a specified horizon",
  },

  {
    id: "FUTURE_REALIZED_VOLATILITY",
    family: "VOLATILITY",
    version: "1.0.0",
    status: "IMPLEMENTED",

    parameters: [
      "horizon",
    ],

    description:
      "Future realized volatility over a specified horizon",
  },

  {
    id: "FUTURE_RANGE",
    family: "RANGE",
    version: "1.0.0",
    status: "PLANNED",

    parameters: [
      "horizon",
    ],

    description:
      "Future high-low range over a specified horizon",
  },

  {
    id: "FUTURE_MAX_DRAWDOWN",
    family: "RISK",
    version: "1.0.0",
    status: "PLANNED",

    parameters: [
      "horizon",
    ],

    description:
      "Maximum drawdown occurring during a future horizon",
  },
];

const getTargetById = (
  id
) =>
  TARGETS.find(
    (target) =>
      target.id === id
  ) ?? null;

const listTargets = () =>
  TARGETS.map(
    (target) => ({
      ...target,
    })
  );

module.exports = {
  getTargetById,
  listTargets,
};