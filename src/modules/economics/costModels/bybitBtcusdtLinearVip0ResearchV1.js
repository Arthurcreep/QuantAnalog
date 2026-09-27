const deepFreeze = (
  value
) => {
  Object.freeze(
    value
  );

  for (
    const nested of
    Object.values(
      value
    )
  ) {
    if (
      nested &&
      typeof nested ===
        "object" &&
      !Object.isFrozen(
        nested
      )
    ) {
      deepFreeze(
        nested
      );
    }
  }

  return value;
};

const BYBIT_BTCUSDT_LINEAR_VIP0_RESEARCH_V1 =
  deepFreeze({
    id:
      "BYBIT_BTCUSDT_LINEAR_VIP0_RESEARCH",

    version:
      "1.0.0",

    status:
      "FROZEN",

    unit:
      "BPS",

    venue:
      "BYBIT",

    instrument:
      "BTCUSDT",

    marketType:
      "LINEAR",

    productType:
      "PERPETUAL",

    feeTier:
      "VIP_0",

    evidenceEligible:
      false,

    evidenceIneligibleReason:
      "SPREAD_SLIPPAGE_MARKET_IMPACT_AND_FUNDING_ARE_NOT_CALIBRATED_FROM_HISTORICAL_EXECUTION_DATA",

    provenance: {
      checkedAt:
        "2026-09-26",

      commissionSource:
        "BYBIT_OFFICIAL_TRADING_FEE_STRUCTURE",

      commissionSourceType:
        "VENUE_DOCUMENTATION",

      actualAccountRateMayVary:
        true,

      makerCommissionBpsPerSide:
        2,

      takerCommissionBpsPerSide:
        5.5,

      fundingMode:
        "ZERO_PLACEHOLDER_UNTIL_HISTORICAL_FUNDING_PIPELINE",

      nonCommissionFrictionMode:
        "RESEARCH_ASSUMPTION",
    },

    scenarioSemantics: {
      OPTIMISTIC:
        "MAKER_LIKE_EXECUTION_WITH_LOW_FRICTION",

      BASE:
        "TAKER_EXECUTION_WITH_MODERATE_RESEARCH_FRICTION",

      STRESS:
        "TAKER_EXECUTION_WITH_STRESSED_RESEARCH_FRICTION",
    },

    scenarios: {
      OPTIMISTIC: {
        commissionBpsPerSide:
          2,

        halfSpreadBpsPerSide:
          0.5,

        slippageBpsPerSide:
          0.5,

        marketImpactBpsPerSide:
          0,

        fundingBpsPerHoldingPeriod:
          0,

        financingBorrowBpsPerHoldingPeriod:
          0,
      },

      BASE: {
        commissionBpsPerSide:
          5.5,

        halfSpreadBpsPerSide:
          1,

        slippageBpsPerSide:
          2,

        marketImpactBpsPerSide:
          0.5,

        fundingBpsPerHoldingPeriod:
          0,

        financingBorrowBpsPerHoldingPeriod:
          0,
      },

      STRESS: {
        commissionBpsPerSide:
          5.5,

        halfSpreadBpsPerSide:
          2,

        slippageBpsPerSide:
          5,

        marketImpactBpsPerSide:
          2,

        fundingBpsPerHoldingPeriod:
          0,

        financingBorrowBpsPerHoldingPeriod:
          0,
      },
    },
  });

module.exports = {
  BYBIT_BTCUSDT_LINEAR_VIP0_RESEARCH_V1,
};