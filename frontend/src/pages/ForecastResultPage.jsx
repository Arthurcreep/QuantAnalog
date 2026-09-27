import {
    useParams,
    useSearchParams,
} from "react-router-dom";

import ForecastVsActualChart from
    "../charts/ForecastVsActualChart.jsx";

import RollingBaselineChart from
    "../charts/RollingBaselineChart.jsx";

import CurrentForecastTable from
    "../components/CurrentForecastTable.jsx";

import ForecastHeader from
    "../components/ForecastHeader.jsx";

import ForecastSummary from
    "../components/ForecastSummary.jsx";

import PageMessage from
    "../components/PageMessage.jsx";

import RunDetails from
    "../components/RunDetails.jsx";

import useForecastResult from
    "../hooks/useForecastResult.js";

const ForecastResultPage =
    () => {
        const {
            id,
        } =
            useParams();

        const [
            searchParams,
        ] =
            useSearchParams();

        const benchmarkForecastRunId =
            searchParams.get(
                "benchmarkForecastRunId"
            );

        const {
            result,
            loading,
            error,
        } =
            useForecastResult({
                forecastRunId:
                    id,

                benchmarkForecastRunId,
            });

        if (loading) {
            return (
                <PageMessage
                    message="Loading forecast result..."
                />
            );
        }

        if (error) {
            return (
                <PageMessage
                    error
                    title="Forecast request failed"
                    message={
                        error
                    }
                />
            );
        }

        if (!result) {
            return (
                <PageMessage
                    message="Forecast result unavailable."
                />
            );
        }

        const context =
            result.performance
                ?.context ||
            {};

        return (
            <div className="min-h-screen bg-zinc-950 text-zinc-100">
                <ForecastHeader
                    context={
                        context
                    }
                    forecastRun={
                        result.forecastRun
                    }
                    lifecycle={
                        result.lifecycle
                    }
                />

                <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
                    <ForecastSummary
                        model={
                            result.model
                        }
                        protocol={
                            result.protocol
                        }
                        validation={
                            result.validation
                        }
                        currentRunIntervalAssessment={
                            result.currentRunIntervalAssessment
                        }
                    />

                    <CurrentForecastTable
                        forecasts={
                            result.currentForecasts
                        }
                    />

                    <ForecastVsActualChart
                        performance={
                            result.performance
                        }
                        horizons={
                            result.forecastRun.horizons
                        }
                    />

                    {result.baselineComparison && (
                        <RollingBaselineChart
                            comparison={
                                result.baselineComparison
                            }
                            horizons={
                                result.forecastRun.horizons
                            }
                        />
                    )}

                    <RunDetails
                        forecastRun={
                            result.forecastRun
                        }
                        lifecycle={
                            result.lifecycle
                        }
                        validation={
                            result.validation
                        }
                        baselineComparison={
                            result.baselineComparison
                        }
                    />
                </main>
            </div>
        );
    };

export default ForecastResultPage;