import {
    useState,
} from "react";

import HorizonSelector from
    "../components/HorizonSelector.jsx";

import TimeSeriesChart from
    "./TimeSeriesChart.jsx";

const METRICS = {
    absoluteError: {
        label:
            "MAE",

        candidateKey:
            "absoluteError.candidateMean",

        benchmarkKey:
            "absoluteError.benchmarkMean",
    },

    qlike: {
        label:
            "QLIKE",

        candidateKey:
            "qlike.candidateMean",

        benchmarkKey:
            "qlike.benchmarkMean",
    },
};

const RollingBaselineChart =
    ({
        comparison,
        horizons = [],
    }) => {
        const defaultHorizon =
            horizons.includes(
                "1d"
            )
                ? "1d"
                : horizons[0];

        const [
            selectedHorizon,
            setSelectedHorizon,
        ] =
            useState(
                defaultHorizon
            );

        const [
            metric,
            setMetric,
        ] =
            useState(
                "absoluteError"
            );

        const horizonComparison =
            comparison
                ?.horizons
            ?.[selectedHorizon];

        const rolling =
            horizonComparison
                ?.rolling;

        const points =
            rolling
                ?.points ||
            [];

        const metricConfig =
            METRICS[
            metric
            ];

        const candidateName =
            comparison
                ?.candidate
                ?.model
                ?.id ||
            comparison
                ?.candidate
                ?.modelId ||
            "Candidate";

        const benchmarkName =
            comparison
                ?.benchmark
                ?.model
                ?.id ||
            comparison
                ?.benchmark
                ?.modelId ||
            "Baseline";

        return (
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/60">
                <div className="border-b border-zinc-800 px-5 py-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Rolling model vs baseline
                            </h2>

                            <p className="mt-1 text-sm text-zinc-500">
                                Backend-calculated rolling forecast loss.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <HorizonSelector
                                horizons={
                                    horizons
                                }
                                value={
                                    selectedHorizon
                                }
                                onChange={
                                    setSelectedHorizon
                                }
                            />

                            <div className="flex gap-2">
                                {Object.entries(
                                    METRICS
                                ).map(
                                    ([
                                        key,
                                        config,
                                    ]) => (
                                        <button
                                            key={
                                                key
                                            }
                                            type="button"
                                            onClick={
                                                () =>
                                                    setMetric(
                                                        key
                                                    )
                                            }
                                            className={
                                                metric ===
                                                    key
                                                    ? "rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-950"
                                                    : "rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                                            }
                                        >
                                            {
                                                config.label
                                            }
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-5">
                    <TimeSeriesChart
                        data={
                            points
                        }
                        lines={[
                            {
                                dataKey:
                                    metricConfig
                                        .candidateKey,

                                name:
                                    candidateName,

                                stroke:
                                    "#60a5fa",
                            },

                            {
                                dataKey:
                                    metricConfig
                                        .benchmarkKey,

                                name:
                                    benchmarkName,

                                stroke:
                                    "#f59e0b",
                            },
                        ]}
                    />

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600">
                        <span>
                            Horizon:{" "}
                            {
                                selectedHorizon ||
                                "—"
                            }
                        </span>

                        <span>
                            Metric:{" "}
                            {
                                metricConfig.label
                            }
                        </span>

                        <span>
                            Window:{" "}
                            {
                                rolling
                                    ?.windowSize ??
                                "—"
                            }
                        </span>

                        <span>
                            Points:{" "}
                            {
                                points.length
                            }
                        </span>

                        <span>
                            Backend calculated
                        </span>
                    </div>
                </div>
            </section>
        );
    };

export default RollingBaselineChart;