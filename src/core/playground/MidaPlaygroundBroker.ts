import { MidaBroker } from "@reiryoku/mida";
import { MidaPlaygroundBrokerAccount } from "#brokers/MidaPlaygroundBrokerAccount";

export class MidaPlaygroundBroker extends MidaBroker {
    public constructor () {
        super({
            name: "PlayTrader",
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
