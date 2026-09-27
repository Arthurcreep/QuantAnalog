const fs = require(
  "fs"
);

const {
  parse,
} = require(
  "csv-parse"
);

const {
  calculateLogReturn,
} = require(
  "../calculations/calculateLogReturn"
);

const {
  timeframeToMilliseconds,
} = require(
  "../../datasets/calculations/timeframeToMilliseconds"
);

const {
  parseTimestamp,
} = require(
  "../../datasets/calculations/parseTimestamp"
);

const {
  INCOMPLETE_BUCKET_POLICIES,
} = require(
  "../../datasets/timeframes/applyIncompleteBucketPolicy"
);

const parseVolume = (
  value
) => {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() ===
      ""
  ) {
    return null;
  }

  const volume =
    Number(value);

  if (
    !Number.isFinite(
      volume
    ) ||
    volume < 0
  ) {
    throw new Error(
      "INVALID_VOLUME_SOURCE_ROW"
    );
  }

  return volume;
};

const buildLogReturnSeries = async ({
  filePath,
  timeframe,
  incompletePolicy,
}) => {
  const timeframeMs =
    timeframeToMilliseconds(
      timeframe
    );

  if (!timeframeMs) {
    throw new Error(
      "UNSUPPORTED_TIMEFRAME"
    );
  }

  const parser = fs
    .createReadStream(
      filePath
    )
    .pipe(
      parse({
        columns:
          true,

        trim:
          true,

        skip_empty_lines:
          true,
      })
    );

  const series = [];

  let previous = null;
  let brokenSequence = false;

  let inputRowCount = 0;
  let usedRowCount = 0;

  let skippedIncompleteCount =
    0;

  let skippedGapReturnCount =
    0;

  for await (
    const row of parser
  ) {
    inputRowCount +=
      1;

    const isComplete =
      String(
        row.is_complete
      ).toLowerCase() ===
      "true";

    if (
      incompletePolicy ===
        INCOMPLETE_BUCKET_POLICIES.DROP &&
      !isComplete
    ) {
      skippedIncompleteCount +=
        1;

      if (previous) {
        brokenSequence =
          true;
      }

      previous = null;

      continue;
    }

    const timestamp =
      parseTimestamp(
        row.timestamp
      );

    const close =
      Number(
        row.close
      );

    const volume =
      parseVolume(
        row.volume
      );

    if (
      timestamp === null ||
      !Number.isFinite(
        close
      ) ||
      close <= 0
    ) {
      throw new Error(
        "INVALID_RETURN_SOURCE_ROW"
      );
    }

    usedRowCount +=
      1;

    if (!previous) {
      if (
        brokenSequence
      ) {
        skippedGapReturnCount +=
          1;

        brokenSequence =
          false;
      }

      previous = {
        timestamp,
        close,
      };

      continue;
    }

    const delta =
      timestamp -
      previous.timestamp;

    if (
      delta !==
      timeframeMs
    ) {
      skippedGapReturnCount +=
        1;

      previous = {
        timestamp,
        close,
      };

      continue;
    }

    series.push({
      timestamp:
        new Date(
          timestamp
        ).toISOString(),

      close,

      volume,

      logReturn:
        calculateLogReturn(
          previous.close,
          close
        ),

      isComplete,
    });

    previous = {
      timestamp,
      close,
    };
  }

  return {
    timeframe,

    incompletePolicy,

    inputRowCount,

    usedRowCount,

    returnCount:
      series.length,

    skippedIncompleteCount,

    skippedGapReturnCount,

    series,
  };
};

module.exports = {
  buildLogReturnSeries,
};