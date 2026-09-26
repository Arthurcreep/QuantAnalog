const BTCUSDT_RESEARCH_FREEZE_V1 = {
  id: "BTCUSDT_RESEARCH_FREEZE_V1",

  version: "1.0.0",

  instrument: "BTCUSDT",

  venue: "BYBIT",

  marketType: "LINEAR",

  researchState: "CANDIDATE_FROZEN",

  datasets: {
    canonical1m:
      "f636a456-db12-42da-a595-ae5763d9e735",

    prepared: {
      "5m":
        "7e6def5c-ea04-46cf-b7aa-f06b3102d0a3",

      "15m":
        "dd79a94f-898a-4c28-a7ac-dd477b72976c",

      "1h":
        "f10885c8-f99e-494e-9ad4-fc0f5c385f26",

      "4h":
        "da08ebbc-9e71-47ad-99e6-117b88deeb3f",

      "1d":
        "1b40b756-002a-4abb-89c4-44ae395af1d8",
    },
  },

  analysisRuns: {
    exploratory: {
      returnProfile1h:
        "6e341c3d-be2b-4d9d-908b-824a43a9c5db",

      initialCalendarHour24h:
        "3effa6eb-7fbd-47c4-9551-24252ac769db",
    },

    volatilityStructure: {
      "5m":
        "2f0f4f44-4100-409b-90e7-34c2751d9ebe",

      "15m":
        "ada3ad56-50eb-42a1-9bbb-53a86e85aba7",

      "1h":
        "1eff9a23-8788-4fab-bd04-65f5e900353c",

      "4h":
        "c1402582-b8d2-4ea4-8290-58e31f481d7b",

      "1d":
        "eb4ac9c8-96db-47d4-9d66-fb7bbd97f560",
    },

    yearlyRobustness: {
      "5m":
        "37889636-2c38-46d8-b597-121154cd88be",

      "15m":
        "f32bc147-76e7-44a0-9658-6cf7ada9b5c4",

      "1h":
        "a5cd21b8-6b61-4d1e-aa24-01edb716b3c5",

      "4h":
        "2d2e8421-d023-4d26-a418-2547a55e7a29",

      "1d":
        "231e67f5-8664-4342-9fe4-e9ce24f2e1db",
    },

    calendarHourCandidate: {
      multiHorizon:
        "af96c313-e7b2-46e5-9eca-09624d83d4ce",

      hacMultipleTesting:
        "3db689f4-9a8c-4b41-a23f-34cdca3646b1",

      blockBootstrap:
        "f339ab0f-bc21-44a6-a432-952d205e41e9",
    },
  },

  volatilityStructure: {
    status:
      "SUPPORTED_WITH_TIMEFRAME_DEPENDENCE",

    findings: {
      strongIntradayClustering: [
        "5m",
        "15m",
        "1h",
      ],

      weakerButPresent: [
        "4h",
      ],

      unstableOrRegimeSensitive: [
        "1d",
      ],
    },
  },

  calendarHourCandidate: {
    id:
      "CALENDAR_HOUR_FUTURE_RV_V1",

    feature:
      "CALENDAR_HOUR_UTC",

    target:
      "FUTURE_REALIZED_VOLATILITY",

    modelTimeframe:
      "1h",

    development: {
      end:
        "2024-12-31T23:59:59.999Z",
    },

    retrospectiveValidation: {
      start:
        "2025-01-01T00:00:00.000Z",
    },

    supportedHorizons: [
      "1h",
      "4h",
      "6h",
      "12h",
    ],

    unsupportedHorizons: [
      "24h",
    ],

    frozenContrasts: {
      "1h": {
        lowHourUtc: 3,
        highHourUtc: 13,
      },

      "4h": {
        lowHourUtc: 2,
        highHourUtc: 12,
      },

      "6h": {
        lowHourUtc: 1,
        highHourUtc: 11,
      },

      "12h": {
        lowHourUtc: 0,
        highHourUtc: 12,
      },

      "24h": {
        lowHourUtc: 22,
        highHourUtc: 12,
        status:
          "NOT_SUPPORTED",
      },
    },

    evidence: {
      profileStability:
        true,

      hac:
        true,

      benjaminiHochberg:
        true,

      movingBlockBootstrap:
        true,

      bootstrapBlockHours:
        168,

      bootstrapIterations:
        2000,
    },

    forwardOos: {
      status:
        "PENDING_FUTURE_DATA",

      eligibilityRule:
        "ONLY_DATA_OBSERVED_AFTER_FREEZE_TIMESTAMP",
    },
  },

  limitations: [
    "Retrospective validation is not true untouched forward OOS",
    "Calendar-hour candidate was discovered using historical data",
    "True forward OOS starts only after the freeze timestamp",
    "No directional return alpha has been established",
    "No trading profitability claim has been established",
    "No economic execution or transaction-cost evaluation has been performed for this candidate",
    "Benjamini-Hochberg correction currently covers the five predefined horizons within this factor experiment, not the future global feature universe",
    "Moving-block bootstrap has currently been evaluated with a 168-hour block length",
    "24-hour future realized volatility is not supported as a calendar-hour factor horizon",
  ],
};

module.exports = {
  BTCUSDT_RESEARCH_FREEZE_V1,
};