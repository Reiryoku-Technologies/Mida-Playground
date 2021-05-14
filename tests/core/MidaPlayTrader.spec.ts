import { MidaPlugin } from "@reiryoku/mida";

describe("MidaPlayTrader", () => {
    describe("exports", () => {
        it("a MidaPlugin instance called plugin", () => {
            expect(require("!/../../src/core/MidaPlayTrader").plugin).toBeInstanceOf(MidaPlugin);
        });
    });
});
