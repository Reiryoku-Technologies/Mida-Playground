import { PlayTraderBroker } from "#brokers/PlayTraderBroker";
import { PlayTraderBrokerAccount } from "#brokers/PlayTraderBrokerAccount";

describe(PlayTraderBroker.name, () => {
    describe(".login", () => {
        it("returns a correctly configured account", async () => {
            const actualDate: Date = new Date();
            const currency: string = "USD";
            const balance: number = 10000;
            const broker: PlayTraderBroker = new PlayTraderBroker();
            const account: PlayTraderBrokerAccount = await broker.login({
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
