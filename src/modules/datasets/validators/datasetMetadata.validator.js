const {
  DATASET_TYPES,
  DATASET_STAGES,
  QUALITY_STATUSES,
} = require("../dataset.constants");

const {
  createAppError,
} = require("../../../errors/appError");

const isValueAllowed = (value, allowedValues) => {
  return Object.values(allowedValues).includes(value);
};

const validateRequiredString = (value, field) => {
  if (typeof value !== "string" || !value.trim()) {
    throw createAppError({
      statusCode: 400,
      code: "INVALID_DATASET_METADATA",
      message: `${field} is required`,
    });
  }
};

const validateDatasetMetadata = (data) => {
  validateRequiredString(data.name, "name");
  validateRequiredString(data.datasetType, "datasetType");
  validateRequiredString(data.stage, "stage");
  validateRequiredString(data.venue, "venue");
  validateRequiredString(data.instrument, "instrument");
  validateRequiredString(data.marketType, "marketType");
  validateRequiredString(data.checksum, "checksum");
  validateRequiredString(data.storageUri, "storageUri");

  if (!isValueAllowed(data.datasetType, DATASET_TYPES)) {
    throw createAppError({
      statusCode: 400,
      code: "INVALID_DATASET_TYPE",
      message: `Unsupported datasetType: ${data.datasetType}`,
    });
  }

  if (!isValueAllowed(data.stage, DATASET_STAGES)) {
    throw createAppError({
      statusCode: 400,
      code: "INVALID_DATASET_STAGE",
      message: `Unsupported dataset stage: ${data.stage}`,
    });
  }

  if (
    data.qualityStatus !== null &&
    data.qualityStatus !== undefined &&
    !isValueAllowed(data.qualityStatus, QUALITY_STATUSES)
  ) {
    throw createAppError({
      statusCode: 400,
      code: "INVALID_QUALITY_STATUS",
      message: `Unsupported qualityStatus: ${data.qualityStatus}`,
    });
  }

  if (
    data.version !== undefined &&
    (!Number.isInteger(data.version) || data.version < 1)
  ) {
    throw createAppError({
      statusCode: 400,
      code: "INVALID_DATASET_VERSION",
      message: "Dataset version must be a positive integer",
    });
  }

  if (
    data.rowCount !== undefined &&
    data.rowCount !== null &&
    (!Number.isInteger(data.rowCount) || data.rowCount < 0)
  ) {
    throw createAppError({
      statusCode: 400,
      code: "INVALID_ROW_COUNT",
      message: "rowCount must be a non-negative integer",
    });
  }

  if (
    data.startTime &&
    data.endTime &&
    new Date(data.startTime) > new Date(data.endTime)
  ) {
    throw createAppError({
      statusCode: 400,
      code: "INVALID_DATASET_PERIOD",
      message: "startTime cannot be later than endTime",
    });
  }

  return true;
};

module.exports = {
  validateDatasetMetadata,
};