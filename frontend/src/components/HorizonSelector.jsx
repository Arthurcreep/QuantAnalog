const HorizonSelector =
    ({
        horizons,
        value,
        onChange,
    }) => {
        return (
            <div className="flex flex-wrap gap-2">
                {horizons.map(
                    (
                        horizon
                    ) => (
                        <button
                            key={
                                horizon
                            }
                            type="button"
                            onClick={
                                () =>
                                    onChange(
                                        horizon
                                    )
                            }
                            className={
                                horizon ===
                                    value
                                    ? "rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-950"
                                    : "rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                            }
                        >
                            {horizon}
                        </button>
                    )
                )}
            </div>
        );
    };

export default HorizonSelector;