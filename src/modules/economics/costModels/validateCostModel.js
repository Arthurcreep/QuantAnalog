const COST_MODEL_SCENARIOS = [
  "OPTIMISTIC",
  "BASE",
  "STRESS",
];

const NON_NEGATIVE_COST_FIELDS = [
  "commissionBpsPerSide",
  "halfSpreadBpsPerSide",
  "slippageBpsPerSide",
  "marketImpactBpsPerSide",
  "financingBorrowBpsPerHoldingPeriod",
];

const SIGNED_COST_FIELDS = [
  "fundingBpsPerHoldingPeriod",
];

const isFiniteNumber = (
  value
) =>
  typeof value ===
    "number" &&
  Number.isFinite(value);

const validateNonEmptyString = ({
  value,
  field,
}) => {
  if (
    typeof value !==
      "string" ||
    value.trim().length ===
      0
  ) {
    throw new Error(
      `INVALID_COST_MODEL_${field}`
    );
  }
};

const validateScenario = ({
  scenarioName,
  scenario,
}) => {
  if (
    !scenario ||
    typeof scenario !==
      "object"
  ) {
    throw new Error(
      `INVALID_COST_MODEL_SCENARIO:${scenarioName}`
    );
  }

  for (
    const field of
    NON_NEGATIVE_COST_FIELDS
  ) {
    const value =
      scenario[field];

    if (
      !isFiniteNumber(
        value
      ) ||
      value < 0
    ) {
      throw new Error(
        `INVALID_COST_MODEL_FIELD:${scenarioName}:${field}`
      );
    }
  }

  for (
    const field of
    SIGNED_COST_FIELDS
  ) {
    const value =
      scenario[field];

    if (
      !isFiniteNumber(
        value
      )
    ) {
      throw new Error(
        `INVALID_COST_MODEL_FIELD:${scenarioName}:${field}`
      );
    }
  }
};

const validateCostModel = (
  costModel
) => {
  if (
    !costModel ||
    typeof costModel !==
      "object"
  ) {
    throw new Error(
      "INVALID_COST_MODEL"
    );
  }

  validateNonEmptyString({
    value:
      costModel.id,

    field:
      "ID",
  });

  validateNonEmptyString({
    value:
      costModel.version,

    field:
      "VERSION",
  });

  if (
    costModel.status !==
    "FROZEN"
  ) {
    throw new Error(
      "COST_MODEL_MUST_BE_FROZEN"
    );
  }

  if (
    costModel.unit !==
    "BPS"
  ) {
    throw new Error(
      "UNSUPPORTED_COST_MODEL_UNIT"
    );
  }

  if (
    !costModel.scenarios ||
    typeof costModel.scenarios !==
      "object"
  ) {
    throw new Error(
      "COST_MODEL_SCENARIOS_REQUIRED"
    );
  }

  for (
    const scenarioName of
    COST_MODEL_SCENARIOS
  ) {
    validateScenario({
      scenarioName,

      scenario:
        costModel
          .scenarios[
            scenarioName
          ],
    });
  }

  return true;
};

module.exports = {
  COST_MODEL_SCENARIOS,
  validateCostModel,
};