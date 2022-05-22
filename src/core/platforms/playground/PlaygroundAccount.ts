import {
    MidaAsset,
    MidaDate,
    MidaEmitter,
    MidaOrder,
    MidaOrderDirection,
    MidaOrderDirectives,
    MidaOrderStatus,
    MidaPeriod,
    MidaPosition,
    MidaPositionDirection,
    MidaPositionStatus,
    MidaSymbol,
    MidaTick,
    MidaTradingAccount,
    MidaTradingAccountOperativity,
    MidaTradingAccountPositionAccounting,
} from "@reiryoku/mida";
import {PlaygroundTrade} from "#platforms/playground/trades/PlaygroundTrade";
import {PlaygroundAccountParameters} from "#platforms/playground/PlaygroundAccountParameters";

export class PlaygroundAccount extends MidaTradingAccount {
    #localDate: MidaDate;
    #balance: number;
    readonly #orders: Map<string, MidaOrder>;
    readonly #trades: Map<string, PlaygroundTrade>;
    #negativeBalanceProtection: boolean;
    #fixedOrderCommission: number;
    #marginCallLevel: number;
    #stopOutLevel: number;
    readonly #symbols: Map<string, MidaSymbol>;
    readonly #localTicks: Map<string, MidaTick[]>;
    readonly #lastTicks: Map<string, MidaTick>;
    readonly #localPeriods: Map<string, MidaPeriod[]>;
    readonly #lastPeriods: Map<string, MidaPeriod>;
    readonly #assets: Map<string, MidaAsset>;
    readonly #positions: Map<string, MidaPosition>;
    readonly #ownedAssets: Map<string, number>;
    readonly #watchedSymbols: Set<string>;
    readonly #internalEmitter: MidaEmitter;

    public constructor ({
        id,
        ownerName,
        platform,
        localDate,
        balance = 100000,
        negativeBalanceProtection = false,
        fixedOrderCommission = 0,
        marginCallLevel = 100,
        stopOutLevel = 50,
    }: PlaygroundAccountParameters) {
        super({
            id,
            platform,
            creationDate: new MidaDate(),
            ownerName,
            primaryAsset: "USD",
            operativity: MidaTradingAccountOperativity.DEMO,
            positionAccounting: MidaTradingAccountPositionAccounting.HEDGED,
            indicativeLeverage: 0,
        });

        this.#localDate = new MidaDate(localDate ?? 378687600000);
        this.#balance = balance;
        this.#orders = new Map();
        this.#trades = new Map();
        this.#negativeBalanceProtection = negativeBalanceProtection;
        this.#fixedOrderCommission = fixedOrderCommission;
        this.#marginCallLevel = marginCallLevel;
        this.#stopOutLevel = stopOutLevel;
        this.#symbols = new Map();
        this.#localTicks = new Map();
        this.#lastTicks = new Map();
        this.#localPeriods = new Map();
        this.#lastPeriods = new Map();
        this.#watchedSymbols = new Set();
        this.#assets = new Map();
        this.#positions = new Map();
        this.#ownedAssets = new Map();
        this.#internalEmitter = new MidaEmitter();
    }

    public get localDate (): MidaDate {
        return this.#localDate.clone();
    }

    public set localDate (date: MidaDate | Date | string | number) {
        if (typeof date === "string" || typeof date === "number") {
            this.#localDate = new MidaDate(date);
        }
        else {
            this.#localDate = new MidaDate({ date, });
        }
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

    public override async getBalance (): Promise<number> {
        return this.#balance;
    }

    public override async getAsset (asset: string): Promise<MidaAsset | undefined> {
        return this.#assets.get(asset);
    }

    public override async getAssets (): Promise<string[]> {
        return [ ...this.#assets.keys(), ];
    }

    public override async getEquity (): Promise<number> {
        return 0;
    }

    public async getUsedMargin (): Promise<number> {
        return 0;
    }

    public override async getOrders (symbol: string): Promise<MidaOrder[]> {
        return [ ...this.#orders.values(), ];
    }

    public override async getPendingOrders (): Promise<MidaOrder[]> {
        const pendingOrders: MidaOrder[] = [];

        for (const order of [ ...this.#orders.values(), ]) {
            if (order.status === MidaOrderStatus.PENDING) {
                pendingOrders.push(order);
            }
        }

        return pendingOrders;
    }

    public async getOrderSwaps (id: string): Promise<number> {
        await this.#assertOrderExists(id);

        return 0;
    }

    public async getOrderCommission (id: string): Promise<number> {
        await this.#assertOrderExists(id);

        return this.#fixedOrderCommission;
    }

    public override async placeOrder (directives: MidaOrderDirectives): Promise<MidaOrder> {
        throw new Error();
    }

    public override async getCryptoAssetDepositAddress (asset: string, net: string): Promise<string> {
        return "";
    }

    public async cancelPendingOrderById (id: string): Promise<void> {
        await this.#assertOrderExists(id);

        const order: MidaOrder = this.#orders.get(id) as MidaOrder;

        if (order.status !== MidaOrderStatus.PENDING) {
            throw new Error("Order is not pending");
        }

        this.#internalEmitter.notifyListeners("order-cancel", {
            orderId: order.id,
            cancelDate: this.#localDate.clone(),
        });
    }

    public async closePosition (id: string): Promise<void> {
        const position: MidaPosition = this.#positions.get(id) as MidaPosition;

        if (position.status !== MidaPositionStatus.OPEN) {
            throw new Error();
        }

        let closePrice: number | undefined;

        switch (position.direction) {
            case MidaPositionDirection.SHORT: {
                closePrice = await this.getSymbolAsk(position.symbol);

                break;
            }
            case MidaPositionDirection.LONG: {
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

        this.#balance += await position.getUnrealizedGrossProfit();

        this.#internalEmitter.notifyListeners("position-close", {
            positionId: position.id,
            closeDate: this.#localDate.clone(),
            closePrice,
        });
    }

    public async clearOrderStopLoss (id: string): Promise<void> {
        await this.#assertOrderExists(id);

        const order: MidaOrder | undefined = this.#orders.get(id);

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

        const order: MidaOrder | undefined = this.#orders.get(id);

        if (!order) {
            throw new Error();
        }

        return 0;
    }

    public async setOrderTakeProfit (id: string, takeProfit: number): Promise<void> {
        await this.#assertOrderExists(id);

        const order: MidaOrder | undefined = this.#orders.get(id);

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

        const order: MidaOrder | undefined = this.#orders.get(id);

        if (!order) {
            throw new Error();
        }

        this.notifyListeners("order-directives", {
            id: order.id,
            takeProfit: undefined,
        });
    }

    public override async getSymbols (): Promise<string[]> {
        return [ ...this.#symbols.keys(), ];
    }

    public override async getSymbol (symbol: string): Promise<MidaSymbol | undefined> {
        return this.#symbols.get(symbol);
    }

    public async isSymbolMarketOpen (symbol: string): Promise<boolean> {
        this.#assertSymbolExists(symbol);

        throw new Error();
    }

    public override async getSymbolPeriods (symbol: string, timeframe: number): Promise<MidaPeriod[]> {
        this.#assertSymbolExists(symbol);

        return [];
    }

    public async getSymbolLastTick (symbol: string): Promise<MidaTick> {
        await this.#assertSymbolExists(symbol);

        return this.#lastTicks.get(symbol) as MidaTick;
    }

    public override async getSymbolBid (symbol: string): Promise<number> {
        const lastTick: MidaTick | undefined = await this.getSymbolLastTick(symbol);

        if (!lastTick) {
            throw new Error();
        }

        return lastTick.bid;
    }

    public override async getSymbolAsk (symbol: string): Promise<number> {
        const lastTick: MidaTick | undefined = await this.getSymbolLastTick(symbol);

        if (!lastTick) {
            throw new Error();
        }

        return lastTick.ask;
    }

    public override async getSymbolAveragePrice (symbol: string): Promise<number> {
        const { bid, ask, } = await this.getSymbolLastTick(symbol);

        return (bid + ask) / 2;
    }

    public async watchSymbolTicks (symbol: string): Promise<void> {
        await this.#assertSymbolExists(symbol);

        this.#watchedSymbols.add(symbol);
    }

    public async logout (): Promise<void> {
        throw new Error();
    }

    public async registerSymbol (symbol: MidaSymbol): Promise<void> {
        this.#symbols.set(symbol.toString(), symbol);
    }

    /**
     * Used to elapse a given amount of time (used to trigger market ticks)
     * @param seconds Amount of seconds to elapse
     */
    public async elapseTime (seconds: number): Promise<MidaTick[]> {
        const previousDate: MidaDate = this.#localDate;
        const actualDate: MidaDate = new MidaDate(this.#localDate.timestamp + seconds * 1000);
        const elapsedTicks: MidaTick[] = [];

        for (const symbol of this.#symbols.keys()) {
            const ticks: MidaTick[] = this.#localTicks.get(symbol) ?? [];

            for (const tick of ticks) {
                if (tick.date.timestamp > previousDate.timestamp && tick.date.timestamp <= actualDate.timestamp) {
                    elapsedTicks.push(tick);
                }
            }
        }

        elapsedTicks.sort((a: MidaTick, b: MidaTick): number => a.date.timestamp - b.date.timestamp);

        for (const tick of elapsedTicks) {
            this.#localDate = tick.date;

            this.#lastTicks.set(tick.symbol, tick);
            await this.#onTick(tick);
        }

        this.#localDate = actualDate;

        return elapsedTicks;
    }

    public deposit (volume: number): void {
        this.#balance += volume;
    }

    public withdraw (volume: number): void {
        this.#balance = Math.max(0, this.#balance - volume);
    }

    public loadTicks (ticks: MidaTick[]): void {
        const symbol: string = ticks[0].symbol;
        const localTicks: MidaTick[] = this.#localTicks.get(symbol) ?? [];
        const updatedTicks: MidaTick[] = localTicks.concat(ticks);

        updatedTicks.sort((a: MidaTick, b: MidaTick): number => a.date.timestamp - b.date.timestamp);

        this.#localTicks.set(symbol, updatedTicks);
    }

    public getSymbolTicks (symbol: string): MidaTick[] {
        return this.#localTicks.get(symbol) ?? [];
    }

    #assertSymbolExists (symbol: string): void {
        if (!this.#symbols.has(symbol)) {
            throw new Error("Symbol not found");
        }
    }

    #assertOrderExists (id: string): void {
        if (!this.#orders.has(id)) {
            throw new Error("Order not found");
        }
    }

    async #executePendingOrder (id: string): Promise<void> {
        const order: MidaOrder | undefined = this.#orders.get(id);

        if (!order) {
            throw new Error();
        }

        if (order.status !== MidaOrderStatus.PENDING) {
            throw new Error();
        }

        let executionPrice: number | undefined;

        switch (order.direction) {
            case MidaOrderDirection.SELL: {
                executionPrice = await this.getSymbolBid(order.symbol);

                break;
            }
            case MidaOrderDirection.BUY: {
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

    async #onTick (tick: MidaTick): Promise<void> {
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
    async #updatePendingOrders (tick: MidaTick): Promise<void> {
        const orders: MidaOrder[] = await this.getPendingOrders();

        for (const order of orders) {
            const {
                limitPrice,
                stopPrice,
            } = order;

            // <limit>
            if (limitPrice !== undefined && Number.isFinite(limitPrice)) {
                if (
                    (order.direction === MidaOrderDirection.SELL && tick.bid >= limitPrice)
                    || (order.direction === MidaOrderDirection.BUY && tick.ask <= limitPrice)
                ) {
                    await this.#executePendingOrder(order.id as string);
                }
            }
            // </limit>

            // <stop>
            if (stopPrice !== undefined && Number.isFinite(stopPrice)) {
                if (
                    (order.direction === MidaOrderDirection.SELL && tick.bid <= stopPrice)
                    || (order.direction === MidaOrderDirection.BUY && tick.ask >= stopPrice)
                ) {
                    await this.#executePendingOrder(order.id as string);
                }
            }
            // </stop>
        }
    }

    // tslint:disable-next-line:cyclomatic-complexity
    async #updateOpenPositions (tick: MidaTick): Promise<void> {
        const openPositions: MidaPosition[] = await this.getOpenPositions();

        for (const position of openPositions) {
            const {
                stopLoss,
                takeProfit,
            } = position.protection;

            // <stop-loss>
            if (stopLoss !== undefined && Number.isFinite(stopLoss)) {
                if (
                    (position.direction === MidaPositionDirection.SHORT && tick.ask >= stopLoss)
                    || (position.direction === MidaPositionDirection.LONG && tick.bid <= stopLoss)
                ) {
                    await position.close();
                }
            }
            // </stop-loss>

            // <take-profit>
            if (takeProfit !== undefined && Number.isFinite(takeProfit)) {
                if (
                    (position.direction === MidaPositionDirection.SHORT && tick.ask <= takeProfit)
                    || (position.direction === MidaPositionDirection.LONG && tick.bid >= takeProfit)
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
