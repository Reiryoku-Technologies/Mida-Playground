import {
    MidaBrokerAccount,
    MidaBrokerAccountOperativity,
    MidaBrokerAccountPositionAccounting,
    MidaBrokerDeal,
    MidaBrokerOrder,
    MidaBrokerOrderDirection,
    MidaBrokerOrderDirectives,
    MidaBrokerOrderStatus,
    MidaBrokerPosition,
    MidaBrokerPositionDirection,
    MidaBrokerPositionStatus,
    MidaDate,
    MidaEmitter,
    MidaSymbol,
    MidaSymbolPeriod,
    MidaSymbolTick,
} from "@reiryoku/mida";
import {MidaPlaygroundBrokerAccountParameters} from "#brokers/playground/MidaPlaygroundBrokerAccountParameters";

// @ts-ignore
export class MidaPlaygroundBrokerAccount extends MidaBrokerAccount {
    #localDate: MidaDate;
    #balance: number;
    readonly #orders: Map<string, MidaBrokerOrder>;
    readonly #deals: Map<string, MidaBrokerDeal>;
    readonly #positions: Map<string, MidaBrokerPosition>;
    #negativeBalanceProtection: boolean;
    #fixedOrderCommission: number;
    #marginCallLevel: number;
    #stopOutLevel: number;
    readonly #localSymbols: Map<string, MidaSymbol>;
    readonly #localTicks: Map<string, MidaSymbolTick[]>;
    readonly #lastTicks: Map<string, MidaSymbolTick>;
    readonly #localPeriods: Map<string, MidaSymbolPeriod[]>;
    readonly #lastPeriods: Map<string, MidaSymbolPeriod>;
    readonly #watchedSymbols: Set<string>;
    readonly #internalEmitter: MidaEmitter;

    public constructor ({
        id,
        ownerName,
        broker,
        localDate,
        balance = 100000,
        negativeBalanceProtection = false,
        fixedOrderCommission = 0,
        marginCallLevel = 100,
        stopOutLevel = 50,
    }: MidaPlaygroundBrokerAccountParameters) {
        super({
            id,
            broker,
            creationDate: new MidaDate(),
            ownerName,
            depositCurrencyIso: "USD",
            depositCurrencyDigits: 2,
            operativity: MidaBrokerAccountOperativity.DEMO,
            positionAccounting: MidaBrokerAccountPositionAccounting.HEDGED,
            indicativeLeverage: 0,
        });

        this.#localDate = new MidaDate(localDate ?? 378687600000);
        this.#balance = balance;
        this.#orders = new Map();
        this.#deals = new Map();
        this.#positions = new Map();
        this.#negativeBalanceProtection = negativeBalanceProtection;
        this.#fixedOrderCommission = fixedOrderCommission;
        this.#marginCallLevel = marginCallLevel;
        this.#stopOutLevel = stopOutLevel;
        this.#localSymbols = new Map();
        this.#localTicks = new Map();
        this.#lastTicks = new Map();
        this.#localPeriods = new Map();
        this.#lastPeriods = new Map();
        this.#watchedSymbols = new Set();
        this.#internalEmitter = new MidaEmitter();
    }

    public get localDate (): MidaDate {
        return this.#localDate.clone();
    }

    public set localDate (date: MidaDate | Date) {
        this.#localDate = new MidaDate({ date, });
    }

    public get negativeBalanceProtection (): boolean {
        return this.#negativeBalanceProtection;
    }

    public set negativeBalanceProtection (negativeBalanceProtection: boolean) {
        this.#negativeBalanceProtection = negativeBalanceProtection;
    }

    public get fixedOrderCommission (): number {
        return this.#fixedOrderCommission;
    }

    public set fixedOrderCommission (commission: number) {
        this.#fixedOrderCommission = Math.abs(commission) * -1;
    }

    public get marginCallLevel (): number {
        return this.#marginCallLevel;
    }

    public set marginCallLevel (marginCallLevel: number) {
        this.#marginCallLevel = marginCallLevel;
    }

    public get stopOutLevel (): number {
        return this.#stopOutLevel;
    }

    public set stopOutLevel (stopOutLevel: number) {
        this.#stopOutLevel = stopOutLevel;
    }

    public async getBalance (): Promise<number> {
        return this.#balance;
    }

    public override async getEquity (): Promise<number> {
        const orders: MidaBrokerPosition[] = await this.getOpenPositions();

        return 0;
    }

    public async getUsedMargin (): Promise<number> {
        // throw new Error();
        return 0;
    }

    public override async getOrders (): Promise<MidaBrokerOrder[]> {
        return [ ...this.#orders.values(), ];
    }

    public override async getOrderById (id: string): Promise<MidaBrokerOrder | undefined> {
        return this.#orders.get(id);
    }

    public async getOrderSwaps (id: string): Promise<number> {
        await this.#assertOrderExists(id);

        return 0;
    }

    public async getOrderCommission (id: string): Promise<number> {
        await this.#assertOrderExists(id);

        return this.#fixedOrderCommission;
    }

    public override async placeOrder (directives: MidaBrokerOrderDirectives): Promise<MidaBrokerOrder> {
        throw new Error();
    }

    public async cancelPendingOrder (id: string): Promise<void> {
        await this.#assertOrderExists(id);

        const order: MidaBrokerOrder = this.#orders.get(id) as MidaBrokerOrder;

        if (order.status !== MidaBrokerOrderStatus.PENDING) {
            throw new Error();
        }

        this.#internalEmitter.notifyListeners("order-cancel", {
            orderId: order.id,
            cancelDate: this.#localDate.clone(),
        });
    }

    public async closePosition (id: string): Promise<void> {
        const position: MidaBrokerPosition = this.#positions.get(id) as MidaBrokerPosition;

        if (position.status !== MidaBrokerPositionStatus.OPEN) {
            throw new Error();
        }

        let closePrice: number | undefined;

        switch (position.direction) {
            case MidaBrokerPositionDirection.SHORT: {
                closePrice = await this.getSymbolAsk(position.symbol);

                break;
            }
            case MidaBrokerPositionDirection.LONG: {
                closePrice = await this.getSymbolBid(position.symbol);

                break;
            }
            default: {
                throw new Error();
            }
        }

        if (!Number.isFinite(closePrice)) {
            throw new Error();
        }

        this.#balance += await position.getUnrealizedNetProfit();

        this.#internalEmitter.notifyListeners("position-close", {
            positionId: position.id,
            closeDate: this.#localDate.clone(),
            closePrice,
        });
    }

    public async getOrderStopLoss (id: string): Promise<number | undefined> {
        await this.#assertOrderExists(id);

        const order: MidaBrokerOrder | undefined = this.#orders.get(id);

        if (!order) {
            throw new Error();
        }

        return 0;
    }

    public setOrderStopLoss (id: string, stopLoss: number): void {
        this.#assertOrderExists(id);

        const order: MidaBrokerOrder = this.#orders.get(id) as MidaBrokerOrder;

        this.#internalEmitter.notifyListeners("order-protection-change", {
            orderId: order.id,
            stopLoss,
        });
    }

    public async clearOrderStopLoss (id: string): Promise<void> {
        await this.#assertOrderExists(id);

        const order: MidaBrokerOrder | undefined = this.#orders.get(id);

        if (!order) {
            throw new Error();
        }

        this.notifyListeners("order-directives", {
            id: order.id,
            stopLoss: undefined,
        });
    }

    public async getOrderTakeProfit (id: string): Promise<number | undefined> {
        await this.#assertOrderExists(id);

        const order: MidaBrokerOrder | undefined = this.#orders.get(id);

        if (!order) {
            throw new Error();
        }

        return 0;
    }

    public async setOrderTakeProfit (id: string, takeProfit: number): Promise<void> {
        await this.#assertOrderExists(id);

        const order: MidaBrokerOrder | undefined = this.#orders.get(id);

        if (!order) {
            throw new Error();
        }

        this.notifyListeners("order-directives", {
            id: order.id,
            takeProfit,
        });
    }

    public async clearOrderTakeProfit (id: string): Promise<void> {
        await this.#assertOrderExists(id);

        const order: MidaBrokerOrder | undefined = this.#orders.get(id);

        if (!order) {
            throw new Error();
        }

        this.notifyListeners("order-directives", {
            id: order.id,
            takeProfit: undefined,
        });
    }

    public async getSymbols (): Promise<string[]> {
        return [ ...this.#localSymbols.keys(), ];
    }

    public async getSymbol (symbol: string): Promise<MidaSymbol | undefined> {
        return this.#localSymbols.get(symbol);
    }

    public async isSymbolMarketOpen (symbol: string): Promise<boolean> {
        this.#assertSymbolExists(symbol);

        throw new Error();
    }

    public override async getSymbolPeriods (symbol: string, timeframe: number): Promise<MidaSymbolPeriod[]> {
        this.#assertSymbolExists(symbol);

        return [];
    }

    public override async getSymbolLastTick (symbol: string): Promise<MidaSymbolTick> {
        await this.#assertSymbolExists(symbol);

        return this.#lastTicks.get(symbol) as MidaSymbolTick;
    }

    public override async getSymbolBid (symbol: string): Promise<number> {
        const lastTick: MidaSymbolTick | undefined = await this.getSymbolLastTick(symbol);

        if (!lastTick) {
            throw new Error();
        }

        return lastTick.bid;
    }

    public override async getSymbolAsk (symbol: string): Promise<number> {
        const lastTick: MidaSymbolTick | undefined = await this.getSymbolLastTick(symbol);

        if (!lastTick) {
            throw new Error();
        }

        return lastTick.ask;
    }

    public async watchSymbolTicks (symbol: string): Promise<void> {
        await this.#assertSymbolExists(symbol);

        this.#watchedSymbols.add(symbol);
    }

    public async logout (): Promise<void> {
        throw new Error();
    }

    public async registerSymbol (symbol: MidaSymbol): Promise<void> {
        this.#localSymbols.set(symbol.toString(), symbol);
    }

    /**
     * Used to elapse a given amount of time (used to trigger market ticks)
     * @param quantity Amount of time to elapse in seconds
     */
    public async elapseTime (quantity: number): Promise<MidaSymbolTick[]> {
        const previousDate: MidaDate = this.#localDate;
        const actualDate: MidaDate = new MidaDate(this.#localDate.timestamp + quantity * 1000);
        const elapsedTicks: MidaSymbolTick[] = [];

        for (const symbol of this.#localSymbols.keys()) {
            const ticks: MidaSymbolTick[] = this.#localTicks.get(symbol) ?? [];

            for (const tick of ticks) {
                if (tick.date.timestamp > previousDate.timestamp && tick.date.timestamp <= actualDate.timestamp) {
                    elapsedTicks.push(tick);
                }
            }
        }

        elapsedTicks.sort((a: MidaSymbolTick, b: MidaSymbolTick): number => a.date.timestamp - b.date.timestamp);

        for (const tick of elapsedTicks) {
            this.#localDate = tick.date.clone();

            this.#lastTicks.set(tick.symbol, tick);
            await this.#onTick(tick);
        }

        this.#localDate = actualDate;

        return elapsedTicks;
    }

    public deposit (quantity: number): void {
        this.#balance += quantity;
    }

    public withdraw (quantity: number): void {
        this.#balance = Math.max(0, this.#balance - quantity);
    }

    public loadTicks (ticks: MidaSymbolTick[]): void {
        const symbol: string = ticks[0].symbol;
        const localTicks: MidaSymbolTick[] = this.#localTicks.get(symbol) || [];
        const updatedTicks: MidaSymbolTick[] = localTicks.concat(ticks);

        updatedTicks.sort((a: MidaSymbolTick, b: MidaSymbolTick): number => a.date.timestamp - b.date.timestamp);

        this.#localTicks.set(symbol, updatedTicks);
    }

    public getSymbolTicks (symbol: string): MidaSymbolTick[] | undefined {
        return this.#localTicks.get(symbol);
    }

    #assertSymbolExists (symbol: string): void {
        if (!this.#localSymbols.has(symbol)) {
            throw new Error();
        }
    }

    #assertOrderExists (id: string): void {
        if (!this.#orders.has(id)) {
            throw new Error();
        }
    }

    async #executePendingOrder (id: string): Promise<void> {
        const order: MidaBrokerOrder | undefined = this.#orders.get(id);

        if (!order) {
            throw new Error();
        }

        if (order.status !== MidaBrokerOrderStatus.PENDING) {
            throw new Error();
        }

        let executionPrice: number | undefined;

        switch (order.direction) {
            case MidaBrokerOrderDirection.SELL: {
                executionPrice = await this.getSymbolBid(order.symbol);

                break;
            }
            case MidaBrokerOrderDirection.BUY: {
                executionPrice = await this.getSymbolAsk(order.symbol);

                break;
            }
            default: {
                throw new Error();
            }
        }

        if (!Number.isFinite(executionPrice)) {
            throw new Error();
        }

        this.notifyListeners("order-execute", {
            orderId: order.id,
            executionDate: this.#localDate.clone(),
            executionPrice,
        });
    }

    async #onTick (tick: MidaSymbolTick): Promise<void> {
        await this.#updatePendingOrders(tick);
        await this.#updateOpenPositions(tick);

        // <margin-call>
        const marginLevel: number = await this.getMarginLevel();

        if (Number.isFinite(marginLevel) && marginLevel <= this.#marginCallLevel) {
            this.notifyListeners("margin-call", { marginLevel, });
        }
        // </margin-call>

        if (this.#watchedSymbols.has(tick.symbol)) {
            this.notifyListeners("tick", { tick, });
        }
    }

    // tslint:disable-next-line:cyclomatic-complexity
    async #updatePendingOrders (tick: MidaSymbolTick): Promise<void> {
        const orders: MidaBrokerOrder[] = await this.getPendingOrders();

        for (const order of orders) {
            const {
                limitPrice,
                stopPrice,
            } = order;

            // <limit>
            if (limitPrice !== undefined && Number.isFinite(limitPrice)) {
                if (
                    (order.direction === MidaBrokerOrderDirection.SELL && tick.bid >= limitPrice)
                    || (order.direction === MidaBrokerOrderDirection.BUY && tick.ask <= limitPrice)
                ) {
                    await this.#executePendingOrder(order.id as string);
                }
            }
            // </limit>

            // <stop>
            if (stopPrice !== undefined && Number.isFinite(stopPrice)) {
                if (
                    (order.direction === MidaBrokerOrderDirection.SELL && tick.bid <= stopPrice)
                    || (order.direction === MidaBrokerOrderDirection.BUY && tick.ask >= stopPrice)
                ) {
                    await this.#executePendingOrder(order.id as string);
                }
            }
            // </stop>
        }
    }

    // tslint:disable-next-line:cyclomatic-complexity
    async #updateOpenPositions (tick: MidaSymbolTick): Promise<void> {
        const openPositions: MidaBrokerPosition[] = await this.getOpenPositions();

        for (const position of openPositions) {
            const {
                stopLoss,
                takeProfit,
            } = position.protection;

            // <stop-loss>
            if (stopLoss !== undefined && Number.isFinite(stopLoss)) {
                if (
                    (position.direction === MidaBrokerPositionDirection.SHORT && tick.ask >= stopLoss)
                    || (position.direction === MidaBrokerPositionDirection.LONG && tick.bid <= stopLoss)
                ) {
                    await position.close();
                }
            }
            // </stop-loss>

            // <take-profit>
            if (takeProfit !== undefined && Number.isFinite(takeProfit)) {
                if (
                    (position.direction === MidaBrokerPositionDirection.SHORT && tick.ask <= takeProfit)
                    || (position.direction === MidaBrokerPositionDirection.LONG && tick.bid >= takeProfit)
                ) {
                    await position.close();
                }
            }
            // </take-profit>

            // <stop-out>
            const marginLevel: number = await this.getMarginLevel();

            if (Number.isFinite(marginLevel) && marginLevel <= this.#stopOutLevel) {
                await position.close();

                this.notifyListeners("stop-out", {
                    positionId: position.id,
                    marginLevel,
                });
            }
            // </stop-out>

            // <negative-balance-protection>
            const equity: number = await this.getEquity();

            if (this.#negativeBalanceProtection && equity < 0) {
                await position.close();
            }
            // </negative-balance-protection>
        }
    }
}
