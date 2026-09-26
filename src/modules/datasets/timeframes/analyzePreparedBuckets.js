const fs = require("fs");

const { parse } = require("csv-parse");

const analyzePreparedBuckets = async (
  filePath
) => {
  const parser = fs
    .createReadStream(filePath)
    .pipe(
      parse({
        columns: true,
        trim: true,
        skip_empty_lines: true,
      })
    );

  let bucketCount = 0;
  let incompleteBucketCount = 0;

  for await (const row of parser) {
    bucketCount += 1;

    if (
      String(row.is_complete)
        .toLowerCase() !== "true"
    ) {
      incompleteBucketCount += 1;
    }
  }

  return {
    bucketCount,

    incompleteBucketCount,

    incompleteBucketRatio:
      bucketCount === 0
        ? 0
        : incompleteBucketCount /
          bucketCount,
  };
};

module.exports = {
  analyzePreparedBuckets,
};