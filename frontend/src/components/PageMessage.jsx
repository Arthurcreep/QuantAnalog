const PageMessage =
    ({
        title = null,
        message,
        error = false,
    }) => {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-8">
                <div
                    className={
                        error
                            ? "max-w-xl rounded-xl border border-red-900 bg-red-950/30 p-6"
                            : "text-zinc-400"
                    }
                >
                    {title && (
                        <div
                            className={
                                error
                                    ? "text-lg font-semibold text-red-300"
                                    : "text-lg font-semibold text-zinc-200"
                            }
                        >
                            {title}
                        </div>
                    )}

                    <div
                        className={
                            error
                                ? "mt-2 text-sm text-red-200"
                                : "text-sm"
                        }
                    >
                        {message}
                    </div>
                </div>
            </div>
        );
    };

export default PageMessage;