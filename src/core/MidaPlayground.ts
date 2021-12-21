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
        //actions.addBroker(new MidaPlaygroundBroker());
    }
}

export { MidaPlaygroundBroker } from "#brokers/playground/MidaPlaygroundBroker";
export { MidaPlaygroundBrokerAccount } from "#brokers/playground/MidaPlaygroundBrokerAccount";
export { MidaPlaygroundBrokerAccountParameters } from "#brokers/playground/MidaPlaygroundBrokerAccountParameters";
