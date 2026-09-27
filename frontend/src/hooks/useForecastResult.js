import {
  useEffect,
  useState,
} from "react";

import {
  getForecastResult,
} from "../api/forecastApi";

const useForecastResult =
  ({
    forecastRunId,
    benchmarkForecastRunId,
  }) => {
    const [
      result,
      setResult,
    ] =
      useState(
        null
      );

    const [
      loading,
      setLoading,
    ] =
      useState(
        true
      );

    const [
      error,
      setError,
    ] =
      useState(
        null
      );

    useEffect(
      () => {
        let active =
          true;

        const load =
          async () => {
            try {
              setLoading(
                true
              );

              setError(
                null
              );

              const data =
                await getForecastResult({
                  forecastRunId,
                  benchmarkForecastRunId,
                });

              if (!active) {
                return;
              }

              setResult(
                data
              );
            } catch (
              requestError
            ) {
              if (!active) {
                return;
              }

              setError(
                requestError
                  ?.response
                  ?.data
                  ?.error
                  ?.message ||
                  requestError
                    ?.message ||
                  "Failed to load forecast result"
              );
            } finally {
              if (active) {
                setLoading(
                  false
                );
              }
            }
          };

        load();

        return () => {
          active =
            false;
        };
      },
      [
        forecastRunId,
        benchmarkForecastRunId,
      ]
    );

    return {
      result,
      loading,
      error,
    };
  };

export default useForecastResult;