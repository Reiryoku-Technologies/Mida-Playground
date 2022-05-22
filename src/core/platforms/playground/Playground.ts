import { GenericObject, MidaTradingPlatform, } from "@reiryoku/mida";
import { PlaygroundAccount, } from "#platforms/playground/PlaygroundAccount";

export class Playground extends MidaTradingPlatform {
    public constructor () {
        super({
            name: "Mida Playground",
            siteUri: "https://github.com/Reiryoku-Technologies/Mida-Playground",
        });
    }

    public override async login (parameters: GenericObject = {}): Promise<PlaygroundAccount> {
        return new PlaygroundAccount({
            ...parameters as any,
            platform: this,
        });
    }
}
