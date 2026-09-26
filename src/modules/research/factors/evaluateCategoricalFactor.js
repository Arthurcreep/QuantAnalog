const {
  calculateCategoricalTargetProfile,
  compareCategoricalProfiles,
} = require(
  "../calculations/factors/calculateCategoricalTargetProfile"
);

const {
  calculateCategoricalHacTest,
} = require(
  "../calculations/factors/calculateCategoricalHacTest"
);

const validateRows = ({
  rows,
  name,
}) => {
  if (
    !Array.isArray(rows) ||
    rows.length === 0
  ) {
    throw new Error(
      `EMPTY_FACTOR_SAMPLE: ${name}`
    );
  }
};

const validateFeature = (
  feature
) => {
  if (
    !feature ||
    feature.kind !==
      "CATEGORICAL" ||
    typeof feature.field !==
      "string" ||
    !Number.isInteger(
      feature.categoryCount
    ) ||
    feature.categoryCount <
      2
  ) {
    throw new Error(
      "INVALID_CATEGORICAL_FEATURE"
    );
  }
};

const validateTarget = (
  target
) => {
  if (
    !target ||
    typeof target.field !==
      "string"
  ) {
    throw new Error(
      "INVALID_FACTOR_TARGET"
    );
  }
};

const getProfileExtremes = (
  profile
) => {
  if (
    !Array.isArray(profile) ||
    profile.length === 0
  ) {
    throw new Error(
      "EMPTY_FACTOR_PROFILE"
    );
  }

  let minimum =
    profile[0];

  let maximum =
    profile[0];

  for (
    const item of profile
  ) {
    if (
      item.mean <
      minimum.mean
    ) {
      minimum = item;
    }

    if (
      item.mean >
      maximum.mean
    ) {
      maximum = item;
    }
  }

  return {
    lowCategory:
      minimum.category,

    lowMean:
      minimum.mean,

    highCategory:
      maximum.category,

    highMean:
      maximum.mean,

    difference:
      maximum.mean -
      minimum.mean,
  };
};

const normalizeHacResult = (
  result
) => ({
  sampleSize:
    result.sampleSize,

  hacLag:
    result.hacLag,

  statistic:
    result.statistic,

  degreesOfFreedom:
    result.degreesOfFreedom,

  pValue:
    result.pValue,

  pValueUnderflow:
    result.pValue === 0,
});

const evaluateCategoricalFactor =
  ({
    developmentRows,
    validationRows,
    feature,
    target,
    hacLag,
  }) => {
    validateRows({
      rows:
        developmentRows,

      name:
        "DEVELOPMENT",
    });

    validateRows({
      rows:
        validationRows,

      name:
        "RETROSPECTIVE_VALIDATION",
    });

    validateFeature(
      feature
    );

    validateTarget(
      target
    );

    if (
      !Number.isInteger(
        hacLag
      ) ||
      hacLag < 0
    ) {
      throw new Error(
        "INVALID_FACTOR_HAC_LAG"
      );
    }

    const development =
      calculateCategoricalTargetProfile({
        rows:
          developmentRows,

        categoryField:
          feature.field,

        targetField:
          target.field,
      });

    const retrospectiveValidation =
      calculateCategoricalTargetProfile({
        rows:
          validationRows,

        categoryField:
          feature.field,

        targetField:
          target.field,
      });

    const stability =
      compareCategoricalProfiles({
        first:
          development.profile,

        second:
          retrospectiveValidation
            .profile,
      });

    const frozenContrast =
      getProfileExtremes(
        development.profile
      );

    const developmentHac =
      calculateCategoricalHacTest({
        rows:
          developmentRows,

        categoryField:
          feature.field,

        targetField:
          target.field,

        categoryCount:
          feature.categoryCount,

        hacLag,
      });

    const validationHac =
      calculateCategoricalHacTest({
        rows:
          validationRows,

        categoryField:
          feature.field,

        targetField:
          target.field,

        categoryCount:
          feature.categoryCount,

        hacLag,
      });

    return {
      feature: {
        name:
          feature.name,

        field:
          feature.field,

        kind:
          feature.kind,

        categoryCount:
          feature.categoryCount,
      },

      target: {
        name:
          target.name,

        field:
          target.field,
      },

      development: {
        rowCount:
          developmentRows.length,

        overall:
          development.overall,

        profile:
          development.profile,

        hac:
          normalizeHacResult(
            developmentHac
          ),
      },

      retrospectiveValidation: {
        rowCount:
          validationRows.length,

        overall:
          retrospectiveValidation
            .overall,

        profile:
          retrospectiveValidation
            .profile,

        hac:
          normalizeHacResult(
            validationHac
          ),
      },

      stability: {
        categoryCount:
          stability.categoryCount,

        profileCorrelation:
          stability
            .meanProfileCorrelation,
      },

      frozenContrast: {
        selectionPeriod:
          "DEVELOPMENT",

        lowCategory:
          frozenContrast
            .lowCategory,

        highCategory:
          frozenContrast
            .highCategory,

        developmentLowMean:
          frozenContrast
            .lowMean,

        developmentHighMean:
          frozenContrast
            .highMean,

        developmentDifference:
          frozenContrast
            .difference,
      },
    };
  };

module.exports = {
  evaluateCategoricalFactor,
};