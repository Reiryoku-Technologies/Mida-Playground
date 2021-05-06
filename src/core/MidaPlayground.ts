import {
    MidaPlugin,
    MidaPluginActions,
} from "@reiryoku/mida";
import { PlaygroundBroker } from "#brokers/PlaygroundBroker";

export const plugin: MidaPlugin = new MidaPlugin({
    name: "Mida Playground",
    description: "A Mida plugin for paper trading and backtesting.",
    version: "1.0.0",

    install (actions: MidaPluginActions): void {
        actions.addBroker(new PlaygroundBroker());
    },
});

export { PlaygroundBroker } from "#brokers/PlaygroundBroker";
export { PlaygroundBrokerAccount } from "#brokers/PlaygroundBrokerAccount";
export { PlaygroundBrokerAccountParameters } from "#brokers/PlaygroundBrokerAccountParameters";
