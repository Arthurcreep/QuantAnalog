const ECONOMIC_ELIGIBILITY_REGISTRY = [
  {
    hypothesisId:
      "H_VOL_001",

    economicMode:
      "DIAGNOSTIC_ONLY",

    minimumEvidenceLevel:
      null,

    decisionRuleId:
      null,

    reason:
      "VOLATILITY_STRUCTURE_DIAGNOSTIC_HAS_NO_DIRECT_TRADING_INTERPRETATION",
  },

  {
    hypothesisId:
      "H_CAL_001",

    economicMode:
      "VOLATILITY_CONDITIONAL",

    minimumEvidenceLevel:
      5,

    decisionRuleId:
      null,
  },

  {
    hypothesisId:
      "H_CAL_002",

    economicMode:
      "VOLATILITY_CONDITIONAL",

    minimumEvidenceLevel:
      5,

    decisionRuleId:
      null,
  },

  {
    hypothesisId:
      "H_CAL_003",

    economicMode:
      "VOLATILITY_CONDITIONAL",

    minimumEvidenceLevel:
      5,

    decisionRuleId:
      null,
  },

  {
    hypothesisId:
      "H_CAL_004",

    economicMode:
      "VOLATILITY_CONDITIONAL",

    minimumEvidenceLevel:
      5,

    decisionRuleId:
      null,
  },

  {
    hypothesisId:
      "H_RET_001",

    economicMode:
      "DIRECTIONAL_RETURN",

    minimumEvidenceLevel:
      5,

    decisionRuleId:
      null,
  },

  {
    hypothesisId:
      "H_VOL_002",

    economicMode:
      "VOLATILITY_CONDITIONAL",

    minimumEvidenceLevel:
      5,

    decisionRuleId:
      null,
  },

  {
    hypothesisId:
      "H_VOL_003",

    economicMode:
      "VOLATILITY_CONDITIONAL",

    minimumEvidenceLevel:
      5,

    decisionRuleId:
      null,
  },

  {
    hypothesisId:
      "H_VOLM_001",

    economicMode:
      "VOLATILITY_CONDITIONAL",

    minimumEvidenceLevel:
      5,

    decisionRuleId:
      null,
  },

  {
    hypothesisId:
      "H_VOLM_002",

    economicMode:
      "DIRECTIONAL_RETURN",

    minimumEvidenceLevel:
      5,

    decisionRuleId:
      null,
  },
];

const getEconomicEligibilityConfig = (
  hypothesisId
) =>
  ECONOMIC_ELIGIBILITY_REGISTRY.find(
    (item) =>
      item.hypothesisId ===
      hypothesisId
  ) || null;

module.exports = {
  ECONOMIC_ELIGIBILITY_REGISTRY,
  getEconomicEligibilityConfig,
};