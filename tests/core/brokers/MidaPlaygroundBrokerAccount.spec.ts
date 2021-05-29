import {
    MidaBrokerOrder,
    MidaBrokerOrderStatusType,
    MidaBrokerOrderType,
    MidaEvent,
    MidaSymbol,
    MidaSymbolQuotation,
    MidaSymbolTick,
    MidaSymbolType,
} from "@reiryoku/mida";
import {MidaPlaygroundBroker} from "#brokers/playground/MidaPlaygroundBroker";
import {MidaPlaygroundBrokerAccount} from "#brokers/playground/MidaPlaygroundBrokerAccount";

describe(MidaPlaygroundBrokerAccount.name, () => {
    const broker: MidaPlaygroundBroker = new MidaPlaygroundBroker();

    describe(".localDate", () => {
        it("is set correctly", async () => {
            const actualDate: Date = new Date();
            const account: MidaPlaygroundBrokerAccount = await broker.login();

            account.localDate = actualDate;

            expect(account.localDate.valueOf()).toBe(actualDate.valueOf());
        });
    });

    describe(".negativeBalanceProtection", () => {
        it("is set correctly", async () => {
            const account: MidaPlaygroundBrokerAccount = await broker.login();

            account.negativeBalanceProtection = false;

            expect(account.negativeBalanceProtection).toBe(false);

            account.negativeBalanceProtection = true;

            expect(account.negativeBalanceProtection).toBe(true);
        });
    });

    describe(".fixedOrderCommission", () => {
        it("is set correctly", async () => {
            const fixedCommission: number = 123.45;
            const account: MidaPlaygroundBrokerAccount = await broker.login();

            account.fixedOrderCommission = fixedCommission;

            expect(account.fixedOrderCommission).toBe(fixedCommission);
        });
    });

    describe(".marginCallLevel", () => {
        it("is set correctly", async () => {
            const marginCallLevel: number = 200;
            const account: MidaPlaygroundBrokerAccount = await broker.login();

            account.marginCallLevel = marginCallLevel;

            expect(account.marginCallLevel).toBe(marginCallLevel);
        });
    });

    describe(".stopOutLevel", () => {
        it("is set correctly", async () => {
            const stopOutLevel: number = 10;
            const account: MidaPlaygroundBrokerAccount = await broker.login();

            account.stopOutLevel = stopOutLevel;

            expect(account.stopOutLevel).toBe(stopOutLevel);
        });
    });

    describe(".getBalance", () => {
        it("returns correct balance", async () => {
            const initialBalance: number = 10000;
            const account: MidaPlaygroundBrokerAccount = await broker.login({
                balance: initialBalance,
            });

            expect(await account.getBalance()).toBe(initialBalance);
        });
    });

    describe(".getEquity", () => {
        it("returns balance when no positions are open", async () => {
            const initialBalance: number = 10000;
            const account: MidaPlaygroundBrokerAccount = await broker.login({
                balance: initialBalance,
            });

            expect(await account.getEquity()).toBe(initialBalance);
            expect(await account.getEquity()).toBe(await account.getBalance());
        });
    });

    describe(".placeOrder", () => {
        it("opens sell market order", async () => {
            const account: MidaPlaygroundBrokerAccount = await broker.login();
            const symbol: MidaSymbol = new MidaSymbol({
                symbol: "TEST",
                brokerAccount: account,
                description: "",
                type: MidaSymbolType.CRYPTO,
                digits: 0,
                leverage: 1 / 20,
                minLots: 1,
                maxLots: 100,
                lotUnits: 1,
            });
            const actualDate: Date = new Date();
            const ticks: MidaSymbolTick[] = [
                new MidaSymbolTick({
                    quotation: new MidaSymbolQuotation({
                        symbol: symbol.toString(),
                        date: actualDate,
                        bid: 1,
                        ask: 2,
                    }),
                }),
                new MidaSymbolTick({
                    quotation: new MidaSymbolQuotation({
                        symbol: symbol.toString(),
                        date: new Date(actualDate.valueOf() + 1000),
                        bid: 3,
                        ask: 4,
                    }),
                }),
                new MidaSymbolTick({
                    quotation: new MidaSymbolQuotation({
                        symbol: symbol.toString(),
                        date: new Date(actualDate.valueOf() + 2000),
                        bid: 5,
                        ask: 6,
                    }),
                }),
            ];

            await account.registerSymbol(symbol);
            await account.loadTicks(ticks);

            account.localDate = new Date(actualDate.valueOf() - 500);

            await account.elapseTime(1);

            const order: MidaBrokerOrder = await account.placeOrder({
                symbol: symbol.toString(),
                type: MidaBrokerOrderType.SELL,
                lots: 1,
            });

            expect(order.type).toBe(MidaBrokerOrderType.SELL);
            expect(order.status).toBe(MidaBrokerOrderStatusType.OPEN);
            expect(order.openPrice).toBe(1);

            await account.elapseTime(2);

            expect(order.openPrice).toBe(1);
        });

        it("opens sell limit order", async () => {
            const account: MidaPlaygroundBrokerAccount = await broker.login();
            const symbol: MidaSymbol = new MidaSymbol({
                symbol: "TEST",
                brokerAccount: account,
                description: "",
                type: MidaSymbolType.CRYPTO,
                digits: 0,
                leverage: 1 / 20,
                minLots: 1,
                maxLots: 100,
                lotUnits: 1,
            });
            const actualDate: Date = new Date();
            const ticks: MidaSymbolTick[] = [
                new MidaSymbolTick({
                    quotation: new MidaSymbolQuotation({
                        symbol: symbol.toString(),
                        date: actualDate,
                        bid: 1,
                        ask: 2,
                    }),
                }),
                new MidaSymbolTick({
                    quotation: new MidaSymbolQuotation({
                        symbol: symbol.toString(),
                        date: new Date(actualDate.valueOf() + 1000),
                        bid: 3,
                        ask: 4,
                    }),
                }),
                new MidaSymbolTick({
                    quotation: new MidaSymbolQuotation({
                        symbol: symbol.toString(),
                        date: new Date(actualDate.valueOf() + 2000),
                        bid: 5,
                        ask: 6,
                    }),
                }),
            ];

            await account.registerSymbol(symbol);
            await account.loadTicks(ticks);

            account.localDate = new Date(actualDate.valueOf() - 500);

            await account.elapseTime(1);

            const order: MidaBrokerOrder = await account.placeOrder({
                symbol: symbol.toString(),
                type: MidaBrokerOrderType.SELL,
                lots: 1,
                limit: 3,
            });

            expect(order.type).toBe(MidaBrokerOrderType.SELL);
            expect(order.status).toBe(MidaBrokerOrderStatusType.PENDING);
            expect(order.openPrice).toBe(undefined);

            await account.elapseTime(2);

            expect(order.status).toBe(MidaBrokerOrderStatusType.OPEN);
            expect(order.openPrice).toBe(3);
        });

        it("opens sell stop order", async () => {
            const account: MidaPlaygroundBrokerAccount = await broker.login();
            const symbol: MidaSymbol = new MidaSymbol({
                symbol: "TEST",
                brokerAccount: account,
                description: "",
                type: MidaSymbolType.CRYPTO,
                digits: 0,
                leverage: 1 / 20,
                minLots: 1,
                maxLots: 100,
                lotUnits: 1,
            });
            const actualDate: Date = new Date();
            const ticks: MidaSymbolTick[] = [
                new MidaSymbolTick({
                    quotation: new MidaSymbolQuotation({
                        symbol: symbol.toString(),
                        date: actualDate,
                        bid: 5,
                        ask: 6,
                    }),
                }),
                new MidaSymbolTick({
                    quotation: new MidaSymbolQuotation({
                        symbol: symbol.toString(),
                        date: new Date(actualDate.valueOf() + 1000),
                        bid: 3,
                        ask: 4,
                    }),
                }),
                new MidaSymbolTick({
                    quotation: new MidaSymbolQuotation({
                        symbol: symbol.toString(),
                        date: new Date(actualDate.valueOf() + 2000),
                        bid: 1,
                        ask: 2,
                    }),
                }),
            ];

            await account.registerSymbol(symbol);
            await account.loadTicks(ticks);

            account.localDate = new Date(actualDate.valueOf() - 500);

            await account.elapseTime(1);

            const order: MidaBrokerOrder = await account.placeOrder({
                symbol: symbol.toString(),
                type: MidaBrokerOrderType.SELL,
                lots: 1,
                stop: 3,
            });

            expect(order.type).toBe(MidaBrokerOrderType.SELL);
            expect(order.status).toBe(MidaBrokerOrderStatusType.PENDING);
            expect(order.openPrice).toBe(undefined);

            await account.elapseTime(2);

            expect(order.status).toBe(MidaBrokerOrderStatusType.OPEN);
            expect(order.openPrice).toBe(3);
        });

        /*
        it("order is closed when stop loss is reached", async () => {
            expect(true).toBe(true);
        });

        it("order is closed when take profit is reached", async () => {
            expect(true).toBe(true);
        });

        it("pending order is opened when limit is reached", async () => {
            expect(true).toBe(true);
        });

        it("pending order is opened when stop is reached", async () => {
            expect(true).toBe(true);
        });
        */
    });

    describe(".loadTicks", () => {
        it("correctly adds ticks for the first time", async () => {
            const account: MidaPlaygroundBrokerAccount = await broker.login();
            const symbol: MidaSymbol = new MidaSymbol({
                symbol: "TEST",
                brokerAccount: account,
                description: "",
                type: MidaSymbolType.CRYPTO,
                digits: 0,
                leverage: 1 / 20,
                minLots: 1,
                maxLots: 100,
                lotUnits: 1,
            });
            const ticks: MidaSymbolTick[] = [
                new MidaSymbolTick({
                    quotation: new MidaSymbolQuotation({
                        symbol: symbol.toString(),
                        date: new Date(),
                        bid: 1,
                        ask: 2,
                    }),
                }),
                new MidaSymbolTick({
                    quotation: new MidaSymbolQuotation({
                        symbol: symbol.toString(),
                        date: new Date((new Date()).valueOf() + 1000),
                        bid: 2,
                        ask: 3,
                    }),
                }),
                new MidaSymbolTick({
                    quotation: new MidaSymbolQuotation({
                        symbol: symbol.toString(),
                        date: new Date((new Date()).valueOf() + 2000),
                        bid: 3,
                        ask: 4,
                    }),
                }),
            ];

            await account.registerSymbol(symbol);
            await account.loadTicks(ticks);

            const accountTicks: MidaSymbolTick[] = (await account.getSymbolTicks(symbol.toString())) as MidaSymbolTick[];

            expect(accountTicks.length).toBe(ticks.length);

            for (let i: number = 0; i < ticks.length; ++i) {
                expect(accountTicks[i].equals(ticks[i])).toBe(true);
            }
        });

        it("sorts added ticks from oldest to newest", async () => {
            const account: MidaPlaygroundBrokerAccount = await broker.login();
            const symbol: MidaSymbol = new MidaSymbol({
                symbol: "TEST",
                brokerAccount: account,
                description: "",
                type: MidaSymbolType.CRYPTO,
                digits: 0,
                leverage: 1 / 20,
                minLots: 1,
                maxLots: 100,
                lotUnits: 1,
            });
            const ticks: MidaSymbolTick[] = [
                new MidaSymbolTick({
                    quotation: new MidaSymbolQuotation({
                        symbol: symbol.toString(),
                        date: new Date(),
                        bid: 1,
                        ask: 2,
                    }),
                }),
                new MidaSymbolTick({
                    quotation: new MidaSymbolQuotation({
                        symbol: symbol.toString(),
                        date: new Date((new Date()).valueOf() + 1000),
                        bid: 3,
                        ask: 4,
                    }),
                }),
                new MidaSymbolTick({
                    quotation: new MidaSymbolQuotation({
                        symbol: symbol.toString(),
                        date: new Date((new Date()).valueOf() - 2000),
                        bid: 5,
                        ask: 6,
                    }),
                }),
                new MidaSymbolTick({
                    quotation: new MidaSymbolQuotation({
                        symbol: symbol.toString(),
                        date: new Date((new Date()).valueOf() + 3000),
                        bid: 7,
                        ask: 8,
                    }),
                }),
            ];

            await account.registerSymbol(symbol);
            await account.loadTicks(ticks);

            const accountTicks: MidaSymbolTick[] = (await account.getSymbolTicks(symbol.toString())) as MidaSymbolTick[];

            expect(accountTicks.length).toBe(ticks.length);

            ticks.sort((a: MidaSymbolTick, b: MidaSymbolTick) => a.date.valueOf() - b.date.valueOf());

            for (let i: number = 0; i < ticks.length; ++i) {
                expect(accountTicks[i].equals(ticks[i])).toBe(true);
            }
        });
    });

    describe(".elapseTime", () => {
        it("increases local date", async () => {
            const actualDate: Date = new Date();
            const account: MidaPlaygroundBrokerAccount = await broker.login();
            const timeToElapse: number = 60;

            account.localDate = actualDate;

            await account.elapseTime(timeToElapse);

            expect(account.localDate.valueOf()).toBe(actualDate.valueOf() + timeToElapse * 1000);

            await account.elapseTime(timeToElapse * 2);

            expect(account.localDate.valueOf()).toBe(actualDate.valueOf() + timeToElapse * 1000 * 3);
        });

        it("triggers tick event for each elapsed tick", async () => {
            const account: MidaPlaygroundBrokerAccount = await broker.login();
            const symbol: MidaSymbol = new MidaSymbol({
                symbol: "TEST",
                brokerAccount: account,
                description: "",
                type: MidaSymbolType.CRYPTO,
                digits: 0,
                leverage: 1 / 20,
                minLots: 1,
                maxLots: 100,
                lotUnits: 1,
            });
            const actualDate: Date = new Date();
            const ticks: MidaSymbolTick[] = [
                new MidaSymbolTick({
                    quotation: new MidaSymbolQuotation({
                        symbol: symbol.toString(),
                        date: actualDate,
                        bid: 1,
                        ask: 2,
                    }),
                }),
                new MidaSymbolTick({
                    quotation: new MidaSymbolQuotation({
                        symbol: symbol.toString(),
                        date: new Date(actualDate.valueOf() + 1000),
                        bid: 3,
                        ask: 4,
                    }),
                }),
                new MidaSymbolTick({
                    quotation: new MidaSymbolQuotation({
                        symbol: symbol.toString(),
                        date: new Date(actualDate.valueOf() + 2000),
                        bid: 5,
                        ask: 6,
                    }),
                }),
            ];

            let firstTickTriggered: boolean = false;
            let secondTickTriggered: boolean = false;
            let thirdTickTriggered: boolean = false;

            account.localDate = new Date(actualDate.valueOf() - 500);

            await account.registerSymbol(symbol);
            await account.loadTicks(ticks);
            await account.watchSymbol(symbol.toString());

            account.on("tick", (event: MidaEvent): void => {
                const tick: MidaSymbolTick = event.descriptor.tick;

                if (tick.equals(ticks[0])) {
                    firstTickTriggered = true;
                }
            });

            await account.elapseTime(1);

            account.on("tick", (event: MidaEvent): void => {
                const tick: MidaSymbolTick = event.descriptor.tick;

                if (tick.equals(ticks[1])) {
                    secondTickTriggered = true;
                }

                if (tick.equals(ticks[2])) {
                    thirdTickTriggered = true;
                }
            });

            await account.elapseTime(5);

            expect(firstTickTriggered).toBe(true);
            expect(secondTickTriggered).toBe(true);
            expect(thirdTickTriggered).toBe(true);
        });

        it("returns elapsed ticks", async () => {
            const account: MidaPlaygroundBrokerAccount = await broker.login();
            const symbol: MidaSymbol = new MidaSymbol({
                symbol: "TEST",
                brokerAccount: account,
                description: "",
                type: MidaSymbolType.CRYPTO,
                digits: 0,
                leverage: 1 / 20,
                minLots: 1,
                maxLots: 100,
                lotUnits: 1,
            });
            const actualDate: Date = new Date();
            const ticks: MidaSymbolTick[] = [
                new MidaSymbolTick({
                    quotation: new MidaSymbolQuotation({
                        symbol: symbol.toString(),
                        date: actualDate,
                        bid: 1,
                        ask: 2,
                    }),
                }),
                new MidaSymbolTick({
                    quotation: new MidaSymbolQuotation({
                        symbol: symbol.toString(),
                        date: new Date(actualDate.valueOf() + 1000),
                        bid: 3,
                        ask: 4,
                    }),
                }),
                new MidaSymbolTick({
                    quotation: new MidaSymbolQuotation({
                        symbol: symbol.toString(),
                        date: new Date(actualDate.valueOf() + 2000),
                        bid: 5,
                        ask: 6,
                    }),
                }),
            ];

            account.localDate = new Date(actualDate.valueOf() + 500);

            await account.registerSymbol(symbol);
            await account.loadTicks(ticks);

            expect((await account.elapseTime(1))[0].equals(ticks[1])).toBe(true);
            expect((await account.elapseTime(2))[0].equals(ticks[2])).toBe(true);
        });
    });

    describe(".deposit", () => {
        it("increases balance", async () => {
            const initialBalance: number = 10000;
            const account: MidaPlaygroundBrokerAccount = await broker.login({
                balance: initialBalance,
            });

            account.deposit(initialBalance);

            expect(await account.getBalance()).toBe(initialBalance * 2);

            account.deposit(initialBalance / 3);

            expect(await account.getBalance()).toBe(initialBalance * 2 + initialBalance / 3);
        });
    });

    describe(".withdraw", () => {
        it("decreases balance", async () => {
            const initialBalance: number = 10000;
            const account: MidaPlaygroundBrokerAccount = await broker.login({
                balance: initialBalance,
            });

            account.withdraw(initialBalance);

            expect(await account.getBalance()).toBe(0);

            account.withdraw(initialBalance / 3);

            expect(await account.getBalance()).toBe(initialBalance / 3 * -1);
        });
    });
});
