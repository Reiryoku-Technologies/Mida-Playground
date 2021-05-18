import { MidaPlaygroundBroker } from "#brokers/MidaPlaygroundBroker";
import { MidaPlaygroundBrokerAccount } from "#brokers/MidaPlaygroundBrokerAccount";

describe(MidaPlaygroundBroker.name, () => {
    describe(".login", () => {
        it("returns a correctly configured account", async () => {
            const actualDate: Date = new Date();
            const currency: string = "USD";
            const balance: number = 10000;
            const broker: MidaPlaygroundBroker = new MidaPlaygroundBroker();
            const account: MidaPlaygroundBrokerAccount = await broker.login({
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
