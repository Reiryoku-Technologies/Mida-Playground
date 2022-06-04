import {
    MidaAsset,
    MidaAssetStatement,
    MidaDate,
    MidaEmitter,
    MidaEventListener,
    MidaOrder,
    MidaOrderDirection,
    MidaOrderDirectives,
    MidaOrderPurpose,
    MidaOrderStatus,
    MidaOrderTimeInForce,
    MidaPeriod,
    MidaPosition,
    MidaPositionDirection,
    MidaSymbol,
    MidaTick,
    MidaTrade,
    MidaTradeDirection,
    MidaTradePurpose,
    MidaTradeStatus,
    MidaTradingAccount,
    MidaTradingAccountOperativity,
    MidaTradingAccountPositionAccounting,
    MidaUtilities,
} from "@reiryoku/mida";
import {PlaygroundTrade} from "#platforms/playground/trades/PlaygroundTrade";
import {PlaygroundAccountParameters} from "#platforms/playground/PlaygroundAccountParameters";
import {PlaygroundOrder} from "#platforms/playground/orders/PlaygroundOrder";
import {PlaygroundPosition} from "#platforms/playground/positions/PlaygroundPosition";

export class PlaygroundAccount extends MidaTradingAccount {
    #localDate: MidaDate;
    #balance: number;
    readonly #orders: Map<string, PlaygroundOrder>;
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
    readonly #positions: Map<string, PlaygroundPosition>;
    readonly #assets: Map<string, MidaAsset>;
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
        this.#positions = new Map();
        this.#watchedSymbols = new Set();
        this.#assets = new Map();
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

    public override async getBalanceSheet (): Promise<MidaAssetStatement[]> {
        return [];
    }

    public override async getAsset (asset: string): Promise<MidaAsset | undefined> {
        return this.#assets.get(asset);
    }

    public override async getAssetBalance (asset: string): Promise<MidaAssetStatement> {
        return {} as MidaAssetStatement;
    }

    public override async getAssets (): Promise<string[]> {
        return [ ...this.#assets.keys(), ];
    }

    public override async getEquity (): Promise<number> {
        return this.getBalance();
    }

    public async getUsedMargin (): Promise<number> {
        return 0;
    }

    public override async getOrders (symbol: string): Promise<MidaOrder[]> {
        return [ ...this.#orders.values(), ].filter((order: MidaOrder) => order.symbol === symbol);
    }

    public override async getPendingOrders (): Promise<PlaygroundOrder[]> {
        const pendingOrders: PlaygroundOrder[] = [];

        for (const order of [ ...this.#orders.values(), ]) {
            if (order.status === MidaOrderStatus.PENDING) {
                pendingOrders.push(order);
            }
        }

        return pendingOrders;
    }

    public override async getTrades (symbol: string): Promise<MidaTrade[]> {
        return [ ...this.#trades.values(), ].filter((trade: MidaTrade) => trade.symbol === symbol);
    }

    public override async getOpenPositions (): Promise<MidaPosition[]> {
        return [];
    }

    public async getOpenPositionById (id: string): Promise<MidaPosition | undefined> {
        const openPositions: MidaPosition[] = await this.getOpenPositions();

        for (const position of openPositions) {
            if (position.id === id) {
                return position;
            }
        }

        return undefined;
    }

    public override async placeOrder (directives: MidaOrderDirectives): Promise<MidaOrder> {
        const positionId: string | undefined = directives.positionId;
        let symbol: string;
        let purpose: MidaOrderPurpose;

        if (positionId) {
            const position: MidaPosition | undefined = await this.getOpenPositionById(positionId);

            if (!position) {
                throw new Error("Position not found");
            }

            symbol = position.symbol;

            if (
                (directives.direction === MidaOrderDirection.BUY && position.direction === MidaPositionDirection.LONG) ||
                (directives.direction === MidaOrderDirection.SELL && position.direction === MidaPositionDirection.SHORT)
            ) {
                purpose = MidaOrderPurpose.OPEN;
            }
            else {
                purpose = MidaOrderPurpose.CLOSE;
            }
        }
        else {
            symbol = directives.symbol as string;

            if (directives.direction === MidaOrderDirection.BUY) {
                purpose = MidaOrderPurpose.OPEN;
            }
            else {
                purpose = MidaOrderPurpose.CLOSE;
            }
        }

        const order: PlaygroundOrder = new PlaygroundOrder({
            id: MidaUtilities.uuid(),
            tradingAccount: this,
            symbol,
            requestedVolume: directives.volume,
            direction: directives.direction,
            purpose,
            limitPrice: directives.limit,
            stopPrice: directives.stop,
            status: MidaOrderStatus.REQUESTED,
            creationDate: new MidaDate(),
            lastUpdateDate: undefined,
            positionId,
            trades: [],
            timeInForce: directives.timeInForce ?? MidaOrderTimeInForce.GOOD_TILL_CANCEL,
            isStopOut: false,
            internalEmitter: this.#internalEmitter,
        });

        this.#orders.set(order.id, order);

        const resolverEvents: string[] = directives.resolverEvents ?? [
            "reject",
            "pending",
            "cancel",
            "expire",
            "execute",
        ];
        const resolver: Promise<PlaygroundOrder> = new Promise((resolve: (order: PlaygroundOrder) => void) => {
            if (resolverEvents.length === 0) {
                resolve(order);
            }
            else {
                const resolverEventsUuids: Map<string, string> = new Map();

                for (const eventType of resolverEvents) {
                    resolverEventsUuids.set(eventType, order.on(eventType, (): void => {
                        for (const uuid of [ ...resolverEventsUuids.values(), ]) {
                            order.removeEventListener(uuid);
                        }

                        resolve(order);
                    }));
                }
            }
        });

        const listeners: { [eventType: string]: MidaEventListener } = directives.listeners ?? {};

        for (const eventType of Object.keys(listeners)) {
            order.on(eventType, listeners[eventType]);
        }

        if (!Number.isFinite(order.limitPrice) && !Number.isFinite(order.stopPrice)) {
            await this.#executeOrder(order);
        }

        return resolver;
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

    async #executeOrder (order: MidaOrder): Promise<void> {
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

        let position: PlaygroundPosition;

        if (!order.positionId) {
            position = new PlaygroundPosition({
                id: MidaUtilities.uuid(),
                symbol: order.symbol,
                volume: order.requestedVolume,
                direction: order.direction === MidaOrderDirection.BUY ? MidaPositionDirection.LONG : MidaPositionDirection.SHORT,
                protection: {},
                tradingAccount: this,
                internalEmitter: this.#internalEmitter,
            });

            this.#positions.set(position.id, position);
        }
        else {
            position = this.#getPositionById(order.positionId) as PlaygroundPosition;
        }

        const purpose: MidaTradePurpose = order.purpose === MidaOrderPurpose.OPEN ? MidaTradePurpose.OPEN : MidaTradePurpose.CLOSE;

        const trade: PlaygroundTrade = new PlaygroundTrade({
            id: MidaUtilities.uuid(),
            orderId: this.id,
            symbol: order.symbol,
            volume: order.requestedVolume,
            direction: order.direction === MidaOrderDirection.BUY ? MidaTradeDirection.BUY : MidaTradeDirection.SELL,
            status: MidaTradeStatus.EXECUTED,
            purpose,
            executionDate: this.#localDate.clone(),
            executionPrice,
            grossProfit: 0,
            commission: 0,
            swap: 0,
            commissionAsset: this.primaryAsset,
            grossProfitAsset: this.primaryAsset,
            positionId: position.id,
            swapAsset: this.primaryAsset,
            tradingAccount: this,
        });

        this.#trades.set(trade.id, trade);

        this.notifyListeners("trade", { trade, });
    }

    #getPositionById (id: string): MidaPosition | undefined {
        return this.#positions.get(id);
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
                    await this.#executeOrder(order);
                }
            }
            // </limit>

            // <stop>
            if (stopPrice !== undefined && Number.isFinite(stopPrice)) {
                if (
                    (order.direction === MidaOrderDirection.SELL && tick.bid <= stopPrice)
                    || (order.direction === MidaOrderDirection.BUY && tick.ask >= stopPrice)
                ) {
                    await this.#executeOrder(order);
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

            /*
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
            */
        }
    }
}
