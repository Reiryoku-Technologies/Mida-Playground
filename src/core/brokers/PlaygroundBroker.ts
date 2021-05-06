import { MidaBroker } from "@reiryoku/mida";
import { PlaygroundBrokerAccount } from "#brokers/PlaygroundBrokerAccount";

export class PlaygroundBroker extends MidaBroker {
    public constructor () {
        super({
            name: "Playground",
            websiteUri: "",
        });
    }

    public async login (parameters: any = {}): Promise<PlaygroundBrokerAccount> {
        return new PlaygroundBrokerAccount({
            broker: this,
            ...parameters,
        });
    }
}
