const {
  buildCalendarFeatures,
} = require(
  "../features/calendar/buildCalendarFeatures"
);

const {
  buildFutureRealizedVolatility,
} = require(
  "../targets/volatility/buildFutureRealizedVolatility"
);

const buildCalendarVolatilityMatrix = ({
  returnSeries,
  horizonBars,
  expectedIntervalMs,
}) => {
  const targets =
    buildFutureRealizedVolatility({
      series:
        returnSeries,

      horizonBars,

      expectedIntervalMs,
    });

  const targetByTimestamp =
    new Map(
      targets.map(
        (target) => [
          target.timestamp,
          target,
        ]
      )
    );

  const rows = [];

  for (
    const item of
    returnSeries
  ) {
    const target =
      targetByTimestamp.get(
        item.timestamp
      );

    if (!target) {
      continue;
    }

    const calendar =
      buildCalendarFeatures({
        timestamp:
          item.timestamp,
      });

    rows.push({
      timestamp:
        item.timestamp,

      calendarHourUtc:
        calendar
          .calendarHourUtc,

      calendarWeekdayUtc:
        calendar
          .calendarWeekdayUtc,

      calendarIsWeekend:
        calendar
          .calendarIsWeekend,

      calendarWeekendUtc:
        calendar
          .calendarWeekendUtc,

      calendarMonthUtc:
        calendar
          .calendarMonthUtc,

      calendarMonthIndexUtc:
        calendar
          .calendarMonthIndexUtc,

      horizonBars:
        target.horizonBars,

      targetStartTimestamp:
        target
          .targetStartTimestamp,

      targetEndTimestamp:
        target
          .targetEndTimestamp,

      futureRealizedVolatility:
        target
          .futureRealizedVolatility,
    });
  }

  return rows;
};

module.exports = {
  buildCalendarVolatilityMatrix,
};