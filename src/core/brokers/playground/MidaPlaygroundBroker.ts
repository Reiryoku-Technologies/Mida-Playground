import { MidaBroker } from "@reiryoku/mida";
import { MidaPlaygroundBrokerAccount } from "#brokers/playground/MidaPlaygroundBrokerAccount";

export class MidaPlaygroundBroker extends MidaBroker {
    public constructor () {
        super({
            name: "#Playground",
            websiteUri: "",
        });
    }

    public async login (parameters: any = {}): Promise<MidaPlaygroundBrokerAccount> {
        return new MidaPlaygroundBrokerAccount({
            broker: this,
            ...parameters,
        });
    }
}
