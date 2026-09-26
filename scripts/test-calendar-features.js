const {
  buildCalendarFeatures,
} = require(
  "../src/modules/research/features/calendar/buildCalendarFeatures"
);

const TEST_TIMESTAMPS = [
  "2026-09-21T14:00:00.000Z",
  "2026-09-19T03:00:00.000Z",
  "2026-01-01T23:00:00.000Z",
];

const run = () => {
  const rows =
    TEST_TIMESTAMPS.map(
      (timestamp) =>
        buildCalendarFeatures({
          timestamp,
        })
    );

  console.table(
    rows
  );
};

run();