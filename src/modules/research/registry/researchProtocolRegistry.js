const {
  VOLATILITY_STRUCTURE_V1,
} = require(
  "../protocols/volatilityStructureV1"
);

const {
  adaptCalendarHourVolatilityV1,
} = require(
  "../protocols/adaptCalendarHourVolatilityV1"
);

const {
  CALENDAR_WEEKDAY_FUTURE_RV_V1,
} = require(
  "../protocols/calendarWeekdayFutureRvV1"
);

const {
  CALENDAR_WEEKEND_FUTURE_RV_V1,
} = require(
  "../protocols/calendarWeekendFutureRvV1"
);

const cloneProtocol = (
  protocol
) =>
  JSON.parse(
    JSON.stringify(
      protocol
    )
  );

const RESEARCH_PROTOCOL_REGISTRY = {
  VOLATILITY_STRUCTURE_V1:
    () =>
      cloneProtocol(
        VOLATILITY_STRUCTURE_V1
      ),

  CALENDAR_HOUR_FUTURE_RV_V1:
    () =>
      adaptCalendarHourVolatilityV1(),

  CALENDAR_WEEKDAY_FUTURE_RV_V1:
    () =>
      cloneProtocol(
        CALENDAR_WEEKDAY_FUTURE_RV_V1
      ),

  CALENDAR_WEEKEND_FUTURE_RV_V1:
    () =>
      cloneProtocol(
        CALENDAR_WEEKEND_FUTURE_RV_V1
      ),
};

const getResearchProtocol = (
  protocolKey
) => {
  const factory =
    RESEARCH_PROTOCOL_REGISTRY[
      protocolKey
    ];

  if (!factory) {
    return null;
  }

  return factory();
};

const hasResearchProtocol = (
  protocolKey
) =>
  Boolean(
    RESEARCH_PROTOCOL_REGISTRY[
      protocolKey
    ]
  );

module.exports = {
  RESEARCH_PROTOCOL_REGISTRY,
  getResearchProtocol,
  hasResearchProtocol,
};