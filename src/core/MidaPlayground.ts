import { MidaPlugin } from "@reiryoku/mida";

export const plugin: MidaPlugin = new MidaPlugin({
    name: "MidaPlayground",
    description: "A Mida plugin for paper trading and backtesting.",
    version: "1.0.0",

    install (): void {
        // Silence is golden.
    },
});
