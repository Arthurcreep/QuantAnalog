const validateVector = (
  value,
  field
) => {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some(
      (item) =>
        !Number.isFinite(
          item
        )
    )
  ) {
    throw new Error(
      `INVALID_${field}`
    );
  }
};

const addVectors = (
  first,
  second
) =>
  first.map(
    (value, index) =>
      value +
      second[index]
  );

const subtractVectors = (
  first,
  second
) =>
  first.map(
    (value, index) =>
      value -
      second[index]
  );

const scaleVector = (
  vector,
  scalar
) =>
  vector.map(
    (value) =>
      value * scalar
  );

const distance = (
  first,
  second
) =>
  Math.sqrt(
    first.reduce(
      (
        sum,
        value,
        index
      ) =>
        sum +
        (
          value -
          second[index]
        ) ** 2,
      0
    )
  );

const safeEvaluate = (
  objective,
  point
) => {
  const value =
    objective(
      point
    );

  if (
    !Number.isFinite(
      value
    )
  ) {
    return Infinity;
  }

  return value;
};

const buildCentroid = (
  simplex
) => {
  const dimension =
    simplex[0]
      .point
      .length;

  const centroid =
    new Array(
      dimension
    ).fill(
      0
    );

  for (
    let index = 0;
    index <
      simplex.length - 1;
    index += 1
  ) {
    for (
      let dimensionIndex = 0;
      dimensionIndex <
        dimension;
      dimensionIndex += 1
    ) {
      centroid[
        dimensionIndex
      ] +=
        simplex[index]
          .point[
            dimensionIndex
          ];
    }
  }

  const divisor =
    simplex.length -
    1;

  return centroid.map(
    (value) =>
      value /
      divisor
  );
};

const minimizeNelderMead = ({
  objective,
  initialPoint,
  initialStep = 0.2,
  maxIterations = 300,
  tolerance = 1e-8,
}) => {
  if (
    typeof objective !==
    "function"
  ) {
    throw new Error(
      "INVALID_OPTIMIZER_OBJECTIVE"
    );
  }

  validateVector(
    initialPoint,
    "OPTIMIZER_INITIAL_POINT"
  );

  if (
    !Number.isInteger(
      maxIterations
    ) ||
    maxIterations <= 0
  ) {
    throw new Error(
      "INVALID_OPTIMIZER_MAX_ITERATIONS"
    );
  }

  if (
    !Number.isFinite(
      tolerance
    ) ||
    tolerance <= 0
  ) {
    throw new Error(
      "INVALID_OPTIMIZER_TOLERANCE"
    );
  }

  const dimension =
    initialPoint.length;

  const steps =
    Array.isArray(
      initialStep
    )
      ? initialStep
      : new Array(
          dimension
        ).fill(
          initialStep
        );

  validateVector(
    steps,
    "OPTIMIZER_INITIAL_STEP"
  );

  if (
    steps.length !==
    dimension
  ) {
    throw new Error(
      "OPTIMIZER_STEP_DIMENSION_MISMATCH"
    );
  }

  const simplex = [
    {
      point:
        [...initialPoint],

      value:
        safeEvaluate(
          objective,
          initialPoint
        ),
    },
  ];

  for (
    let index = 0;
    index <
      dimension;
    index += 1
  ) {
    const point =
      [...initialPoint];

    point[index] +=
      steps[index];

    simplex.push({
      point,

      value:
        safeEvaluate(
          objective,
          point
        ),
    });
  }

  const reflectionCoefficient =
    1;

  const expansionCoefficient =
    2;

  const contractionCoefficient =
    0.5;

  const shrinkCoefficient =
    0.5;

  let iterations =
    0;

  let converged =
    false;

  for (
    iterations = 0;
    iterations <
      maxIterations;
    iterations += 1
  ) {
    simplex.sort(
      (first, second) =>
        first.value -
        second.value
    );

    const best =
      simplex[0];

    const worst =
      simplex[
        simplex.length - 1
      ];

    const objectiveSpread =
      Math.max(
        ...simplex.map(
          (item) =>
            Math.abs(
              item.value -
              best.value
            )
        )
      );

    const pointSpread =
      Math.max(
        ...simplex.map(
          (item) =>
            distance(
              item.point,
              best.point
            )
        )
      );

    if (
      objectiveSpread <=
        tolerance &&
      pointSpread <=
        tolerance
    ) {
      converged =
        true;

      break;
    }

    const centroid =
      buildCentroid(
        simplex
      );

    const reflectedPoint =
      addVectors(
        centroid,
        scaleVector(
          subtractVectors(
            centroid,
            worst.point
          ),
          reflectionCoefficient
        )
      );

    const reflectedValue =
      safeEvaluate(
        objective,
        reflectedPoint
      );

    if (
      reflectedValue <
      best.value
    ) {
      const expandedPoint =
        addVectors(
          centroid,
          scaleVector(
            subtractVectors(
              reflectedPoint,
              centroid
            ),
            expansionCoefficient
          )
        );

      const expandedValue =
        safeEvaluate(
          objective,
          expandedPoint
        );

      if (
        expandedValue <
        reflectedValue
      ) {
        simplex[
          simplex.length - 1
        ] = {
          point:
            expandedPoint,

          value:
            expandedValue,
        };
      } else {
        simplex[
          simplex.length - 1
        ] = {
          point:
            reflectedPoint,

          value:
            reflectedValue,
        };
      }

      continue;
    }

    const secondWorst =
      simplex[
        simplex.length - 2
      ];

    if (
      reflectedValue <
      secondWorst.value
    ) {
      simplex[
        simplex.length - 1
      ] = {
        point:
          reflectedPoint,

        value:
          reflectedValue,
      };

      continue;
    }

    const shouldOutsideContract =
      reflectedValue <
      worst.value;

    const contractionTarget =
      shouldOutsideContract
        ? reflectedPoint
        : worst.point;

    const contractedPoint =
      addVectors(
        centroid,
        scaleVector(
          subtractVectors(
            contractionTarget,
            centroid
          ),
          contractionCoefficient
        )
      );

    const contractedValue =
      safeEvaluate(
        objective,
        contractedPoint
      );

    const contractionThreshold =
      shouldOutsideContract
        ? reflectedValue
        : worst.value;

    if (
      contractedValue <
      contractionThreshold
    ) {
      simplex[
        simplex.length - 1
      ] = {
        point:
          contractedPoint,

        value:
          contractedValue,
      };

      continue;
    }

    for (
      let index = 1;
      index <
        simplex.length;
      index += 1
    ) {
      const shrunkPoint =
        addVectors(
          best.point,
          scaleVector(
            subtractVectors(
              simplex[index]
                .point,
              best.point
            ),
            shrinkCoefficient
          )
        );

      simplex[index] = {
        point:
          shrunkPoint,

        value:
          safeEvaluate(
            objective,
            shrunkPoint
          ),
      };
    }
  }

  simplex.sort(
    (first, second) =>
      first.value -
      second.value
  );

  return {
    point:
      simplex[0]
        .point,

    value:
      simplex[0]
        .value,

    iterations,

    converged,
  };
};

module.exports = {
  minimizeNelderMead,
};