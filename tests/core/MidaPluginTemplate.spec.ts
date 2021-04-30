import { MidaPlugin } from "@reiryoku/mida";

describe("MidaPluginTemplate", () => {
    describe("exports", () => {
        it("a MidaPlugin instance called plugin", () => {
            expect(require("!/src/core/MidaPluginTemplate").plugin).toBeInstanceOf(MidaPlugin);
        });
    });
});
