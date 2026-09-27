import {
    useState,
} from "react";

import HorizonSelector from
    "../components/HorizonSelector.jsx";

import TimeSeriesChart from
    "./TimeSeriesChart.jsx";

const ForecastVsActualChart =
    ({
        performance,
        horizons,
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

        const observations =
            performance
                ?.horizons
                ?.[selectedHorizon]
                ?.observations ||
            [];

        return (
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/60">
                <div className="border-b border-zinc-800 px-5 py-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Forecast vs Actual
                            </h2>

                            <p className="mt-1 text-sm text-zinc-500">
                                Historical forecast and realized volatility.
                            </p>
                        </div>

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
                    </div>
                </div>

                <div className="p-5">
                    <TimeSeriesChart
                        data={
                            observations
                        }
                        lines={[
                            {
                                dataKey:
                                    "prediction",

                                name:
                                    "Forecast",

                                stroke:
                                    "#60a5fa",
                            },

                            {
                                dataKey:
                                    "actual",

                                name:
                                    "Actual",

                                stroke:
                                    "#34d399",
                            },
                        ]}
                    />
                </div>
            </section>
        );
    };

export default ForecastVsActualChart;