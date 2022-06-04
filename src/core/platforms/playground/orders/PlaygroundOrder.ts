import {
    MidaDate,
    MidaEmitter,
    MidaEvent,
    MidaOrder,
    MidaOrderStatus,
} from "@reiryoku/mida";
import {PlaygroundOrderParameters} from "#platforms/playground/orders/PlaygroundOrderParameters";
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

        if (status === MidaOrderStatus.REQUESTED) {
            this.lastUpdateDate = new MidaDate();

            this.onStatusChange(MidaOrderStatus.ACCEPTED);

            if (Number.isFinite(limitPrice) || Number.isFinite(stopPrice)) {
                this.lastUpdateDate = new MidaDate();

                this.onStatusChange(MidaOrderStatus.PENDING);
            }
        }
    }

    get #playgroundAccount (): PlaygroundAccount {
        return this.tradingAccount as PlaygroundAccount;
    }

    public override async cancel (): Promise<void> {
        if (this.status !== MidaOrderStatus.PENDING) {
            return;
        }

        await this.#playgroundAccount.cancelPendingOrderById(this.id);
    }

    #execute (event: MidaEvent): void {
        const { trade, } = event.descriptor;
        this.lastUpdateDate = trade.executionDate.clone();
        this.positionId = trade.positionId;

        this.onTrade(trade);
        this.onStatusChange(MidaOrderStatus.EXECUTED);
    }

    #cancel (event: MidaEvent): void {
        this.lastUpdateDate = event.descriptor.cancelDate.clone();
        this.onStatusChange(MidaOrderStatus.CANCELLED);
    }

    #configureListeners () {
        this.#internalEmitter.on("trade", (event: MidaEvent): void => {
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
