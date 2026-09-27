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

const {
  CALENDAR_MONTH_FUTURE_RV_V1,
} = require(
  "../protocols/calendarMonthFutureRvV1"
);

const {
  LAGGED_RETURN_FUTURE_RETURN_V1,
} = require(
  "../protocols/laggedReturnFutureReturnV1"
);

const {
  CURRENT_RV_FUTURE_RV_V1,
} = require(
  "../protocols/currentRvFutureRvV1"
);

const {
  ABSOLUTE_RETURN_FUTURE_RV_V1,
} = require(
  "../protocols/absoluteReturnFutureRvV1"
);

const {
  VOLUME_ZSCORE_FUTURE_RV_V1,
} = require(
  "../protocols/volumeZScoreFutureRvV1"
);

const {
  VOLUME_ZSCORE_FUTURE_RETURN_V1,
} = require(
  "../protocols/volumeZScoreFutureReturnV1"
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

  CALENDAR_MONTH_FUTURE_RV_V1:
    () =>
      cloneProtocol(
        CALENDAR_MONTH_FUTURE_RV_V1
      ),

  LAGGED_RETURN_FUTURE_RETURN_V1:
    () =>
      cloneProtocol(
        LAGGED_RETURN_FUTURE_RETURN_V1
      ),

  CURRENT_RV_FUTURE_RV_V1:
    () =>
      cloneProtocol(
        CURRENT_RV_FUTURE_RV_V1
      ),

  ABSOLUTE_RETURN_FUTURE_RV_V1:
    () =>
      cloneProtocol(
        ABSOLUTE_RETURN_FUTURE_RV_V1
      ),

  VOLUME_ZSCORE_FUTURE_RV_V1:
    () =>
      cloneProtocol(
        VOLUME_ZSCORE_FUTURE_RV_V1
      ),

  VOLUME_ZSCORE_FUTURE_RETURN_V1:
    () =>
      cloneProtocol(
        VOLUME_ZSCORE_FUTURE_RETURN_V1
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