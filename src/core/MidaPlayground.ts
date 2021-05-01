import {
    MidaPlugin,
    MidaBroker,
} from "@reiryoku/mida";
import { PlaygroundBroker } from "#broker/PlaygroundBroker";

export const plugin: MidaPlugin = new MidaPlugin({
    name: "MidaPlayground",
    description: "A Mida plugin for paper trading and backtesting.",
    version: "1.0.0",

    install (): void {
        MidaBroker.add(new PlaygroundBroker());
    },
});
