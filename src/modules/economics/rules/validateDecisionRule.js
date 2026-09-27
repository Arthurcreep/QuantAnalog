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
      `INVALID_DECISION_RULE_${field}`
    );
  }
};

const validateDecisionRule = (
  decisionRule
) => {
  if (
    !decisionRule ||
    typeof decisionRule !==
      "object"
  ) {
    throw new Error(
      "INVALID_DECISION_RULE"
    );
  }

  validateNonEmptyString({
    value:
      decisionRule.id,

    field:
      "ID",
  });

  validateNonEmptyString({
    value:
      decisionRule.version,

    field:
      "VERSION",
  });

  if (
    decisionRule.status !==
    "FROZEN"
  ) {
    throw new Error(
      "DECISION_RULE_MUST_BE_FROZEN"
    );
  }

  validateNonEmptyString({
    value:
      decisionRule.inputMode,

    field:
      "INPUT_MODE",
  });

  validateNonEmptyString({
    value:
      decisionRule.positionMode,

    field:
      "POSITION_MODE",
  });

  return true;
};

module.exports = {
  validateDecisionRule,
};