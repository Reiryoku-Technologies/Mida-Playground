import { MidaPlugin, MidaPluginActions, } from "@reiryoku/mida";
import { MidaPlaygroundBroker} from "#brokers/playground/MidaPlaygroundBroker";

const PLUGIN_ID: string = "aab4cfe0-71b3-4027-baa1-20d82caa0304";

class MidaPlaygroundPlugin extends MidaPlugin {
    public constructor () {
        super({
            id: PLUGIN_ID,
            name: "Mida Playground",
            description: "A Mida plugin for backtesting and paper trading in global financial markets",
            version: "1.0.0",
        });
    }

    public override install (actions: MidaPluginActions): void {
        actions.addBroker("Playground", MidaPlaygroundPlugin.#broker);
    }

    /* *** *** *** Reiryoku Technologies *** *** *** */

    static readonly #broker: MidaPlaygroundBroker = new MidaPlaygroundBroker();

    public static get broker (): MidaPlaygroundBroker {
        return MidaPlaygroundPlugin.#broker;
    }
}

export { PLUGIN_ID };
export { MidaPlaygroundPlugin };
export { MidaPlaygroundBroker } from "#brokers/playground/MidaPlaygroundBroker";
export { MidaPlaygroundBrokerAccount } from "#brokers/playground/MidaPlaygroundBrokerAccount";
export { MidaPlaygroundBrokerAccountParameters } from "#brokers/playground/MidaPlaygroundBrokerAccountParameters";
