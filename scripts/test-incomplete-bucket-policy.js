const fs = require("fs/promises");
const path = require("path");

const { parse } = require(
  "csv-parse/sync"
);

const {
  INCOMPLETE_BUCKET_POLICIES,
  applyIncompleteBucketPolicy,
} = require(
  "../src/modules/datasets/timeframes/applyIncompleteBucketPolicy"
);

const run = async () => {
  const directory = path.resolve(
    "storage/temp-bucket-policy"
  );

  const inputPath = path.join(
    directory,
    "prepared.csv"
  );

  const keepPath = path.join(
    directory,
    "keep.csv"
  );

  const dropPath = path.join(
    directory,
    "drop.csv"
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
      [
        [
          "timestamp",
          "open",
          "high",
          "low",
          "close",
          "volume",
          "source_count",
          "expected_source_count",
          "is_complete",
        ].join(","),

        "2026-09-20T00:00:00Z,100,104,99,103,33,3,5,false",

        "2026-09-20T00:05:00Z,103,109,102,108,75,5,5,true",

        "2026-09-20T00:10:00Z,108,112,107,111,57,3,5,false",
      ].join("\n")
    );

    const keepResult =
      await applyIncompleteBucketPolicy({
        inputPath,
        outputPath:
          keepPath,

        policy:
          INCOMPLETE_BUCKET_POLICIES.KEEP,
      });

    const dropResult =
      await applyIncompleteBucketPolicy({
        inputPath,
        outputPath:
          dropPath,

        policy:
          INCOMPLETE_BUCKET_POLICIES.DROP,
      });

    const keepRows = parse(
      await fs.readFile(
        keepPath,
        "utf8"
      ),
      {
        columns: true,
        trim: true,
        skip_empty_lines: true,
      }
    );

    const dropRows = parse(
      await fs.readFile(
        dropPath,
        "utf8"
      ),
      {
        columns: true,
        trim: true,
        skip_empty_lines: true,
      }
    );

    console.dir(
      {
        keepResult,
        dropResult,
      },
      {
        depth: null,
      }
    );

    if (
      keepRows.length !== 3
    ) {
      throw new Error(
        "KEEP policy removed rows"
      );
    }

    if (
      keepResult
        .droppedIncompleteCount !== 0
    ) {
      throw new Error(
        "KEEP policy dropped incomplete buckets"
      );
    }

    if (
      dropRows.length !== 1
    ) {
      throw new Error(
        "DROP policy produced incorrect row count"
      );
    }

    if (
      dropResult
        .droppedIncompleteCount !== 2
    ) {
      throw new Error(
        "DROP policy did not remove incomplete buckets"
      );
    }

    if (
      dropRows[0].is_complete !==
      "true"
    ) {
      throw new Error(
        "DROP output contains incomplete bucket"
      );
    }

    console.log(
      "Incomplete bucket policy test passed"
    );
  } catch (error) {
    console.error(
      "Incomplete bucket policy test failed:",
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