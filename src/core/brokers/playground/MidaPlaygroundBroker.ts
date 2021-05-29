import {
    MidaBroker,
    GenericObject,
} from "@reiryoku/mida";
import { MidaPlaygroundBrokerAccount } from "#brokers/playground/MidaPlaygroundBrokerAccount";

export class MidaPlaygroundBroker extends MidaBroker {
    public constructor () {
        super({
            name: "Playground",
            websiteUri: "https://github.com/Reiryoku-Technologies/Mida-Playground",
        });
    }

    public async login (parameters: GenericObject): Promise<MidaPlaygroundBrokerAccount> {
        return new MidaPlaygroundBrokerAccount({
            ...parameters as any,
            broker: this,
        });
    }
}
