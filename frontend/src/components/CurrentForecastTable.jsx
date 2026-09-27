import StatusBadge from
    "./StatusBadge.jsx";

import {
    formatNumber,
} from "../utils/formatters.js";

const CurrentForecastTable =
    ({
        forecasts,
    }) => {
        return (
            <section className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60">
                <div className="border-b border-zinc-800 px-5 py-4">
                    <h2 className="text-lg font-semibold">
                        Current forecasts
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                        Backend forecast result and realized outcome.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                            <tr>
                                <th className="px-5 py-3">
                                    Horizon
                                </th>

                                <th className="px-5 py-3">
                                    Forecast
                                </th>

                                <th className="px-5 py-3">
                                    Interval
                                </th>

                                <th className="px-5 py-3">
                                    Actual
                                </th>

                                <th className="px-5 py-3">
                                    QLIKE
                                </th>

                                <th className="px-5 py-3">
                                    Coverage
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {forecasts.map(
                                (
                                    forecast
                                ) => {
                                    const interval =
                                        forecast
                                            .prediction
                                            ?.interval;

                                    return (
                                        <tr
                                            key={
                                                forecast.forecastId
                                            }
                                            className="border-b border-zinc-800/70 last:border-b-0"
                                        >
                                            <td className="px-5 py-4 font-medium">
                                                {
                                                    forecast.horizon
                                                }
                                            </td>

                                            <td className="px-5 py-4 font-mono text-zinc-300">
                                                {formatNumber(
                                                    forecast
                                                        .prediction
                                                        ?.value
                                                )}
                                            </td>

                                            <td className="px-5 py-4 font-mono text-zinc-400">
                                                {interval
                                                    ? `${formatNumber(
                                                        interval.lower
                                                    )} — ${formatNumber(
                                                        interval.upper
                                                    )}`
                                                    : "—"}
                                            </td>

                                            <td className="px-5 py-4 font-mono text-zinc-300">
                                                {formatNumber(
                                                    forecast
                                                        .actual
                                                        ?.value
                                                )}
                                            </td>

                                            <td className="px-5 py-4 font-mono text-zinc-300">
                                                {formatNumber(
                                                    forecast
                                                        .evaluation
                                                        ?.metrics
                                                        ?.qlike
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                <StatusBadge
                                                    status={
                                                        forecast
                                                            .intervalAssessment
                                                            ?.position
                                                    }
                                                />
                                            </td>
                                        </tr>
                                    );
                                }
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        );
    };

export default CurrentForecastTable;