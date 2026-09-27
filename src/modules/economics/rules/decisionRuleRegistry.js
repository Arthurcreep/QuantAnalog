const DECISION_RULE_REGISTRY = [];

const getDecisionRule = (
  decisionRuleId
) =>
  DECISION_RULE_REGISTRY.find(
    (item) =>
      item.id ===
      decisionRuleId
  ) || null;

const isDecisionRuleImplemented = (
  decisionRuleId
) =>
  getDecisionRule(
    decisionRuleId
  )?.status ===
  "IMPLEMENTED";

module.exports = {
  DECISION_RULE_REGISTRY,
  getDecisionRule,
  isDecisionRuleImplemented,
};