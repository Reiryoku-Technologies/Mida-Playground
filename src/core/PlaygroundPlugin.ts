import { MidaPlugin, MidaPluginActions, } from "@reiryoku/mida";
import { Playground, } from "#platforms/playground/Playground";

export const pluginId: string = "aab4cfe0-71b3-4027-baa1-20d82caa0304";
export const pluginVersion: string = "1.0.0";

export class PlaygroundPlugin extends MidaPlugin {
    public constructor () {
        super({
            id: pluginId,
            name: "Mida Playground",
            description: "A Mida plugin for backtesting and paper trading in global financial markets",
            version: pluginVersion,
        });
    }

    public override install (actions: MidaPluginActions): void {
        actions.addPlatform("Playground", new Playground());
    }
}
