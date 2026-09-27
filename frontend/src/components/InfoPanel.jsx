const InfoPanel =
    ({
        title,
        rows,
    }) => {
        return (
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
                <h2 className="text-lg font-semibold">
                    {title}
                </h2>

                <div className="mt-4 divide-y divide-zinc-800">
                    {rows.map(
                        (
                            [
                                label,
                                value,
                            ]
                        ) => (
                            <div
                                key={
                                    label
                                }
                                className="grid gap-2 py-3 sm:grid-cols-[160px_1fr]"
                            >
                                <div className="text-sm text-zinc-500">
                                    {label}
                                </div>

                                <div className="break-all text-sm text-zinc-200">
                                    {value ??
                                        "—"}
                                </div>
                            </div>
                        )
                    )}
                </div>
            </section>
        );
    };

export default InfoPanel;