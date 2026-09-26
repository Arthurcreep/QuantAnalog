const {
  expandCapabilities,
} = require(
  "./dataCapabilityRegistry"
);

const STATUS = {
  READY:
    "READY",

  NEED_ACQUISITION:
    "NEED_ACQUISITION",

  UNAVAILABLE:
    "UNAVAILABLE",
};

const auditHypothesisDataAvailability =
  ({
    hypothesis,
    availableData = [],
    acquirableData = [],
  }) => {
    if (
      !hypothesis ||
      !Array.isArray(
        hypothesis.requiredData
      )
    ) {
      throw new Error(
        "INVALID_HYPOTHESIS_FOR_AVAILABILITY_AUDIT"
      );
    }

    const available =
      new Set(
        expandCapabilities(
          availableData
        )
      );

    const acquirable =
      new Set(
        expandCapabilities(
          acquirableData
        )
      );

    const required =
      hypothesis.requiredData;

    const missing =
      required.filter(
        (item) =>
          !available.has(item)
      );

    if (
      missing.length === 0
    ) {
      return {
        hypothesisId:
          hypothesis.id,

        status:
          STATUS.READY,

        requiredData:
          [...required],

        availableData:
          [...available],

        missingData: [],

        acquirableMissingData: [],

        unavailableData: [],
      };
    }

    const acquirableMissingData =
      missing.filter(
        (item) =>
          acquirable.has(item)
      );

    const unavailableData =
      missing.filter(
        (item) =>
          !acquirable.has(item)
      );

    const status =
      unavailableData.length > 0
        ? STATUS.UNAVAILABLE
        : STATUS.NEED_ACQUISITION;

    return {
      hypothesisId:
        hypothesis.id,

      status,

      requiredData:
        [...required],

      availableData:
        [...available],

      missingData:
        missing,

      acquirableMissingData,

      unavailableData,
    };
  };

module.exports = {
  STATUS,
  auditHypothesisDataAvailability,
};