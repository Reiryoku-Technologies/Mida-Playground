import { MidaBroker } from "@reiryoku/mida";
import { PlaygroundBrokerAccount } from "#broker/PlaygroundBrokerAccount";

export class PlaygroundBroker extends MidaBroker {
    public constructor () {
        super({
            name: "PlaygroundBroker",
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
