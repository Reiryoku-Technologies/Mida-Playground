import {
    MidaPlugin,
    MidaPluginActions,
} from "@reiryoku/mida";
import { MidaPlaygroundBroker } from "#brokers/playground/MidaPlaygroundBroker";

export const plugin: MidaPlugin = new MidaPlugin({
    id: "mida-playground",
    name: "Mida Playground",
    description: "A Mida plugin to practice and backtest operations in global financial markets.",
    version: "1.0.0",

    install (actions: MidaPluginActions): void {
        actions.addBroker(new MidaPlaygroundBroker());
    },
});

export { MidaPlaygroundBroker } from "#brokers/playground/MidaPlaygroundBroker";
export { MidaPlaygroundBrokerAccount } from "#brokers/playground/MidaPlaygroundBrokerAccount";
export { MidaPlaygroundBrokerAccountParameters } from "#brokers/playground/MidaPlaygroundBrokerAccountParameters";
