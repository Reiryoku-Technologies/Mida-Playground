import {
    MidaOrder,
    MidaOrderStatus,
    MidaEmitter,
    MidaEvent,
    MidaUtilities, MidaTradeDirection, MidaTradeStatus, MidaTradePurpose
} from "@reiryoku/mida";
import {PlaygroundOrderParameters} from "#platforms/playground/orders/PlaygroundOrderParameters";
import {PlaygroundTrade} from "#platforms/playground/trades/PlaygroundTrade";
import {PlaygroundAccount} from "#platforms/playground/PlaygroundAccount";


export class PlaygroundOrder extends MidaOrder {
    readonly #internalEmitter: MidaEmitter;

    public constructor ({
        id,
        tradingAccount,
        symbol,
        requestedVolume,
        direction,
        purpose,
        limitPrice,
        stopPrice,
        status,
        creationDate,
        lastUpdateDate,
        trades,
        timeInForce,
        isStopOut,
        internalEmitter,
    }: PlaygroundOrderParameters) {
        super({
            id,
            tradingAccount,
            symbol,
            requestedVolume,
            direction,
            purpose,
            limitPrice,
            stopPrice,
            status,
            creationDate,
            lastUpdateDate,
            trades,
            timeInForce,
            isStopOut,
        });

        this.#internalEmitter = internalEmitter;
    }

    get #playgroundAccount (): PlaygroundAccount {
        return this.tradingAccount as PlaygroundAccount;
    }

    public override async cancel (): Promise<void> {
        if (this.status !== MidaOrderStatus.PENDING || !this.id) {
            return;
        }

        await this.#playgroundAccount.cancelPendingOrderById(this.id);
    }

    #execute (event: MidaEvent): void {
        const {
            executionDate,
            executionPrice,
        } = event.descriptor;

        this.lastUpdateDate = executionDate.clone();

        if (this.status !== MidaOrderStatus.PENDING) {
            this.onStatusChange(MidaOrderStatus.ACCEPTED);
        }

        this.onTrade(new PlaygroundTrade({
            id: MidaUtilities.uuid(),
            orderId: this.id,
            symbol: this.symbol,
            volume: this.requestedVolume,
            direction: MidaTradeDirection.BUY,
            status: MidaTradeStatus.EXECUTED,
            purpose: MidaTradePurpose.OPEN,
            executionDate: executionDate.clone(),
            executionPrice,
            grossProfit: 0,
            commission: 0,
            swap: 0,
            commissionAsset: "USD",
            grossProfitAsset: "USD",
            positionId: "",
            swapAsset: "USD",
            tradingAccount: this.tradingAccount,
        }));
        this.onStatusChange(MidaOrderStatus.EXECUTED);
    }

    #cancel (event: MidaEvent): void {
        this.lastUpdateDate = event.descriptor.cancelDate.clone();
        this.onStatusChange(MidaOrderStatus.CANCELLED);
    }

    #configureListeners () {
        this.#internalEmitter.on("order-execute", (event: MidaEvent): void => {
            if (event.descriptor.orderId === this.id) {
                this.#execute(event);
            }
        });

        this.#internalEmitter.on("order-cancel", (event: MidaEvent): void => {
            if (event.descriptor.orderId === this.id) {
                this.#cancel(event);
            }
        });
    }
}
