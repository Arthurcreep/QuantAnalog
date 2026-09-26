const validateTimestamp = (
  timestamp
) => {
  const time =
    new Date(
      timestamp
    );

  if (
    Number.isNaN(
      time.getTime()
    )
  ) {
    throw new Error(
      "INVALID_CALENDAR_TIMESTAMP"
    );
  }

  return time;
};

const buildCalendarFeatures = ({
  timestamp,
}) => {
  const time =
    validateTimestamp(
      timestamp
    );

  const hour =
    time.getUTCHours();

  const weekday =
    time.getUTCDay();

  const month =
    time.getUTCMonth() + 1;

  const isWeekend =
    weekday === 0 ||
    weekday === 6;

  return {
    timestamp:
      time.toISOString(),

    calendarHourUtc:
      hour,

    calendarWeekdayUtc:
      weekday,

    calendarIsWeekend:
      isWeekend,

    calendarWeekendUtc:
      isWeekend
        ? 1
        : 0,

    calendarMonthUtc:
      month,
  };
};

module.exports = {
  buildCalendarFeatures,
};