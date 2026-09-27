const formatNumber =
  (
    value,
    digits = 6
  ) => {
    if (
      value === null ||
      value === undefined
    ) {
      return "—";
    }

    return Number(
      value
    ).toFixed(
      digits
    );
  };

const formatPercent =
  (value) => {
    if (
      value === null ||
      value === undefined
    ) {
      return "—";
    }

    return `${(
      Number(value) *
      100
    ).toFixed(2)}%`;
  };

const formatUtcDate =
  (value) => {
    if (!value) {
      return "—";
    }

    return (
      new Date(
        value
      ).toLocaleString(
        "ru-RU",
        {
          timeZone:
            "UTC",

          year:
            "numeric",

          month:
            "2-digit",

          day:
            "2-digit",

          hour:
            "2-digit",

          minute:
            "2-digit",

          second:
            "2-digit",

          hour12:
            false,
        }
      ) +
      " UTC"
    );
  };

const formatShortUtcDate =
  (value) => {
    if (!value) {
      return "";
    }

    return new Date(
      value
    ).toLocaleDateString(
      "en-GB",
      {
        timeZone:
          "UTC",

        day:
          "2-digit",

        month:
          "short",
      }
    );
  };

export {
  formatNumber,
  formatPercent,
  formatUtcDate,
  formatShortUtcDate,
};