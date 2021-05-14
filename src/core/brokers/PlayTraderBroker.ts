import { MidaBroker } from "@reiryoku/mida";
import { PlayTraderBrokerAccount } from "#brokers/PlayTraderBrokerAccount";

export class PlayTraderBroker extends MidaBroker {
    public constructor () {
        super({
            name: "PlayTrader",
            websiteUri: "",
        });
    }

    public async login (parameters: any = {}): Promise<PlayTraderBrokerAccount> {
        return new PlayTraderBrokerAccount({
            broker: this,
            ...parameters,
        });
    }
}
