import {
    MidaPlugin,
    MidaPluginActions, MidaPluginParameters,
} from "@reiryoku/mida";
import { MidaPlaygroundBroker } from "#brokers/playground/MidaPlaygroundBroker";

export class MidaPlaygroundPlugin extends MidaPlugin {
    public constructor (parameters: MidaPluginParameters) {
        super(parameters);
    }

    public override install (actions: MidaPluginActions): void {
        actions.addBroker(MidaPlaygroundPlugin.#broker);
    }

    /* *** *** *** Reiryoku Technologies *** *** *** */

    static readonly #broker: MidaPlaygroundBroker = new MidaPlaygroundBroker();

    public static get broker (): MidaPlaygroundBroker {
        return MidaPlaygroundPlugin.#broker;
    }
}

export { MidaPlaygroundBroker } from "#brokers/playground/MidaPlaygroundBroker";
export { MidaPlaygroundBrokerAccount } from "#brokers/playground/MidaPlaygroundBrokerAccount";
export { MidaPlaygroundBrokerAccountParameters } from "#brokers/playground/MidaPlaygroundBrokerAccountParameters";
