import { MidaPlugin } from "@reiryoku/mida";

describe("MidaPlayground", () => {
    describe("exports", () => {
        it("a MidaPlugin instance called plugin", () => {
            expect(require("!/src/core/MidaPlayground").plugin).toBeInstanceOf(MidaPlugin);
        });
    });
});
