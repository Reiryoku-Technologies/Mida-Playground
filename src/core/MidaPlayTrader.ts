import {
    MidaPlugin,
    MidaPluginActions,
} from "@reiryoku/mida";
import { MidaPlaygroundBroker } from "#playground/MidaPlaygroundBroker";

export default new MidaPlugin({
    id: "mida-playground",
    name: "Mida Playground",
    description: "A Mida plugin to practice and backtest operations in global financial markets.",
    version: "1.0.0",

    install (actions: MidaPluginActions): void {
        actions.addBroker(new MidaPlaygroundBroker());
    },
});

export { MidaPlaygroundBroker } from "#playground/MidaPlaygroundBroker";
export { MidaPlaygroundBrokerAccount } from "#playground/MidaPlaygroundBrokerAccount";
export { MidaPlaygroundBrokerAccountParameters } from "#playground/MidaPlaygroundBrokerAccountParameters";
