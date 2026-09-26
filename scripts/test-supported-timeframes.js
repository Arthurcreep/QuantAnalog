const fs = require("fs/promises");
const path = require("path");

const {
  aggregateCandleTimeframe,
} = require(
  "../src/modules/datasets/timeframes/aggregateCandleTimeframe"
);

const TARGETS = [
  {
    timeframe: "5m",
    expectedRows: 288,
    expectedSourceRows: 5,
  },
  {
    timeframe: "15m",
    expectedRows: 96,
    expectedSourceRows: 15,
  },
  {
    timeframe: "1h",
    expectedRows: 24,
    expectedSourceRows: 60,
  },
  {
    timeframe: "4h",
    expectedRows: 6,
    expectedSourceRows: 240,
  },
  {
    timeframe: "1d",
    expectedRows: 1,
    expectedSourceRows: 1440,
  },
];

const buildOneDayOfMinutes = () => {
  const start =
    Date.parse(
      "2026-09-20T00:00:00Z"
    );

  const rows = [
    "timestamp,open,high,low,close,volume",
  ];

  for (
    let index = 0;
    index < 1440;
    index += 1
  ) {
    const timestamp =
      new Date(
        start + index * 60_000
      ).toISOString();

    const open =
      100 + index;

    rows.push(
      [
        timestamp,
        open,
        open + 2,
        open - 1,
        open + 1,
        1,
      ].join(",")
    );
  }

  return rows.join("\n");
};

const testTarget = async ({
  inputPath,
  directory,
  target,
}) => {
  const outputPath = path.join(
    directory,
    `output-${target.timeframe}.csv`
  );

  const result =
    await aggregateCandleTimeframe({
      inputPath,
      outputPath,

      sourceTimeframe:
        "1m",

      targetTimeframe:
        target.timeframe,
    });

  if (
    result.outputRowCount !==
    target.expectedRows
  ) {
    throw new Error(
      `${target.timeframe}: expected ${target.expectedRows} rows, got ${result.outputRowCount}`
    );
  }

  if (
    result.expectedSourceRows !==
    target.expectedSourceRows
  ) {
    throw new Error(
      `${target.timeframe}: incorrect source row requirement`
    );
  }

  if (
    result.incompleteBucketCount !== 0
  ) {
    throw new Error(
      `${target.timeframe}: expected no incomplete buckets`
    );
  }

  return {
    timeframe:
      target.timeframe,

    outputRowCount:
      result.outputRowCount,

    expectedSourceRows:
      result.expectedSourceRows,

    incompleteBucketCount:
      result.incompleteBucketCount,
  };
};

const run = async () => {
  const directory = path.resolve(
    "storage/temp-supported-timeframes"
  );

  const inputPath = path.join(
    directory,
    "one-day-1m.csv"
  );

  try {
    await fs.mkdir(
      directory,
      {
        recursive: true,
      }
    );

    await fs.writeFile(
      inputPath,
      buildOneDayOfMinutes()
    );

    const results = [];

    for (const target of TARGETS) {
      const result =
        await testTarget({
          inputPath,
          directory,
          target,
        });

      results.push(result);
    }

    console.table(results);

    console.log(
      "Supported timeframes test passed"
    );
  } catch (error) {
    console.error(
      "Supported timeframes test failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await fs.rm(
      directory,
      {
        recursive: true,
        force: true,
      }
    );
  }
};

run();