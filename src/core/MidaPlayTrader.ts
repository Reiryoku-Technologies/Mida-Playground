import {
    MidaPlugin,
    MidaPluginActions,
} from "@reiryoku/mida";
import { PlayTraderBroker } from "#brokers/PlayTraderBroker";

export default new MidaPlugin({
    id: "mida-playground",
    name: "Mida Playground",
    description: "A Mida plugin to practice and backtest operations in global financial markets.",
    version: "1.0.0",

    install (actions: MidaPluginActions): void {
        actions.addBroker(new PlayTraderBroker());
    },
});

export { PlayTraderBroker } from "#brokers/PlayTraderBroker";
export { PlayTraderBrokerAccount } from "#brokers/PlayTraderBrokerAccount";
export { PlayTraderBrokerAccountParameters } from "#brokers/PlayTraderBrokerAccountParameters";
