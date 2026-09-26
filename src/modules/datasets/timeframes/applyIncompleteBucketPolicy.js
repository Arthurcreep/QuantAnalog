const fs = require("fs");
const fsPromises = require("fs/promises");
const path = require("path");

const { parse } = require("csv-parse");
const { stringify } = require("csv-stringify");

const INCOMPLETE_BUCKET_POLICIES = {
  KEEP: "KEEP_INCOMPLETE",
  DROP: "DROP_INCOMPLETE",
};

const applyIncompleteBucketPolicy = async ({
  inputPath,
  outputPath,
  policy,
}) => {
  if (
    !Object.values(
      INCOMPLETE_BUCKET_POLICIES
    ).includes(policy)
  ) {
    throw new Error(
      "UNSUPPORTED_INCOMPLETE_BUCKET_POLICY"
    );
  }

  await fsPromises.mkdir(
    path.dirname(outputPath),
    {
      recursive: true,
    }
  );

  const parser = fs
    .createReadStream(inputPath)
    .pipe(
      parse({
        columns: true,
        trim: true,
        skip_empty_lines: true,
      })
    );

  const outputStream =
    fs.createWriteStream(outputPath);

  let writer = null;

  let inputRowCount = 0;
  let outputRowCount = 0;
  let droppedIncompleteCount = 0;

  for await (const row of parser) {
    if (!writer) {
      writer = stringify({
        header: true,
        columns: Object.keys(row),
      });

      writer.pipe(outputStream);
    }

    inputRowCount += 1;

    const isComplete =
      String(row.is_complete)
        .toLowerCase() === "true";

    if (
      policy ===
        INCOMPLETE_BUCKET_POLICIES.DROP &&
      !isComplete
    ) {
      droppedIncompleteCount += 1;
      continue;
    }

    writer.write(row);
    outputRowCount += 1;
  }

  if (!writer) {
    throw new Error(
      "EMPTY_PREPARED_DATASET"
    );
  }

  writer.end();

  await new Promise(
    (resolve, reject) => {
      outputStream.on(
        "finish",
        resolve
      );

      outputStream.on(
        "error",
        reject
      );

      writer.on(
        "error",
        reject
      );
    }
  );

  return {
    policy,
    inputRowCount,
    outputRowCount,
    droppedIncompleteCount,
  };
};

module.exports = {
  INCOMPLETE_BUCKET_POLICIES,
  applyIncompleteBucketPolicy,
};