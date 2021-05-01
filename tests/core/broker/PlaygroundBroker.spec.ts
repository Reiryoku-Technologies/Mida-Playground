import { PlaygroundBroker } from "#broker/PlaygroundBroker";
import { PlaygroundBrokerAccount } from "#broker/PlaygroundBrokerAccount";

describe("PlaygroundBroker", () => {
    describe(".login", () => {
        it("returns a correctly configured account", async () => {
            const actualDate: Date = new Date();
            const currency: string = "USD";
            const balance: number = 10000;
            const broker: PlaygroundBroker = new PlaygroundBroker();
            const account: PlaygroundBrokerAccount = await broker.login({
                localDate: actualDate,
                currency,
                balance,
            });

            expect(account.localDate.valueOf()).toBe(actualDate.valueOf());
            expect(account.currency).toBe(currency);
            expect(await account.getBalance()).toBe(balance);
        });
    });
});
