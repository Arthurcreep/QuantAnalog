const {
  applyBenjaminiHochberg,
} = require(
  "../calculations/applyBenjaminiHochberg"
);

const attachFactorMultipleTesting =
  (
    horizonResults
  ) => {
    const developmentTests =
      applyBenjaminiHochberg(
        horizonResults.map(
          (item) => ({
            horizon:
              item.horizon,

            pValue:
              item
                .evaluation
                .development
                .hac
                .pValue,
          })
        )
      );

    const validationTests =
      applyBenjaminiHochberg(
        horizonResults.map(
          (item) => ({
            horizon:
              item.horizon,

            pValue:
              item
                .evaluation
                .retrospectiveValidation
                .hac
                .pValue,
          })
        )
      );

    const developmentMap =
      new Map(
        developmentTests.map(
          (item) => [
            item.horizon,
            item.adjustedPValue,
          ]
        )
      );

    const validationMap =
      new Map(
        validationTests.map(
          (item) => [
            item.horizon,
            item.adjustedPValue,
          ]
        )
      );

    return horizonResults.map(
      (item) => ({
        ...item,

        multipleTesting: {
          method:
            "BENJAMINI_HOCHBERG",

          scope:
            "PREDEFINED_HORIZONS_WITHIN_FACTOR_PROTOCOL",

          developmentAdjustedPValue:
            developmentMap.get(
              item.horizon
            ),

          validationAdjustedPValue:
            validationMap.get(
              item.horizon
            ),
        },
      })
    );
  };

module.exports = {
  attachFactorMultipleTesting,
};