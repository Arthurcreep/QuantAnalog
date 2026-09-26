const {
  createAppError,
} = require(
  "../../../errors/appError"
);

const COMPATIBILITY_FIELDS = [
  "datasetType",
  "venue",
  "instrument",
  "marketType",
  "sourceTimeframe",
  "timezone",
];

const validateStitchSources = (
  datasets
) => {
  if (datasets.length < 2) {
    throw createAppError({
      statusCode: 400,
      code: "STITCH_REQUIRES_MULTIPLE_DATASETS",
      message:
        "Stitching requires at least two datasets",
    });
  }

  const reference = datasets[0];

  if (
    datasets.some(
      (dataset) =>
        dataset.stage !== "CLEAN"
    )
  ) {
    throw createAppError({
      statusCode: 400,
      code: "INVALID_STITCH_SOURCE_STAGE",
      message:
        "Stitching accepts CLEAN datasets only",
    });
  }

  for (const dataset of datasets.slice(1)) {
    for (const field of COMPATIBILITY_FIELDS) {
      if (
        dataset[field] !==
        reference[field]
      ) {
        throw createAppError({
          statusCode: 400,
          code:
            "INCOMPATIBLE_STITCH_SOURCES",
          message:
            `Dataset mismatch: ${field}`,
          details: {
            field,
            expected:
              reference[field],
            actual:
              dataset[field],
          },
        });
      }
    }
  }

  return true;
};

module.exports = {
  validateStitchSources,
};