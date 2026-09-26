const BYBIT_BASE_URL =
  process.env.BYBIT_BASE_URL ||
  "https://api.bybit.com";

const sleep = (milliseconds) =>
  new Promise((resolve) =>
    setTimeout(resolve, milliseconds)
  );

const requestBybit = async ({
  pathname,
  params,
  maxRetries = 4,
}) => {
  let lastError = null;

  for (
    let attempt = 0;
    attempt <= maxRetries;
    attempt += 1
  ) {
    try {
      const query =
        new URLSearchParams(
          Object.entries(params).reduce(
            (result, [key, value]) => {
              if (
                value !== undefined &&
                value !== null
              ) {
                result[key] =
                  String(value);
              }

              return result;
            },
            {}
          )
        );

      const response =
        await fetch(
          `${BYBIT_BASE_URL}${pathname}?${query}`,
          {
            signal:
              AbortSignal.timeout(
                15_000
              ),
          }
        );

      const payload =
        await response.json();

      if (!response.ok) {
        throw new Error(
          `BYBIT_HTTP_ERROR_${response.status}`
        );
      }

      if (payload.retCode !== 0) {
        throw new Error(
          `BYBIT_API_ERROR_${payload.retCode}: ${payload.retMsg}`
        );
      }

      return payload;
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        break;
      }

      const delay =
        Math.min(
          500 * 2 ** attempt,
          4000
        );

      await sleep(delay);
    }
  }

  throw lastError;
};

const fetchBybitKlines = async ({
  category,
  symbol,
  interval,
  start,
  end,
  limit = 1000,
}) => {
  const payload =
    await requestBybit({
      pathname:
        "/v5/market/kline",

      params: {
        category,
        symbol,
        interval,
        start,
        end,
        limit,
      },
    });

  if (
    !Array.isArray(
      payload.result?.list
    )
  ) {
    throw new Error(
      "BYBIT_INVALID_KLINE_RESPONSE"
    );
  }

  return payload.result.list;
};

const fetchBybitInstrument =
  async ({
    category,
    symbol,
  }) => {
    const payload =
      await requestBybit({
        pathname:
          "/v5/market/instruments-info",

        params: {
          category,
          symbol,
        },
      });

    const instrument =
      payload.result?.list?.find(
        (item) =>
          item.symbol === symbol
      );

    if (!instrument) {
      throw new Error(
        `BYBIT_INSTRUMENT_NOT_FOUND_${symbol}`
      );
    }

    const launchTime =
      Number(
        instrument.launchTime
      );

    if (
      !Number.isFinite(
        launchTime
      )
    ) {
      throw new Error(
        "BYBIT_INVALID_LAUNCH_TIME"
      );
    }

    return {
      ...instrument,
      launchTime,
    };
  };

module.exports = {
  fetchBybitKlines,
  fetchBybitInstrument,
};