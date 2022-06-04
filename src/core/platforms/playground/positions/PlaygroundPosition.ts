import {
    MidaEmitter,
    MidaOrder,
    MidaOrderDirection,
    MidaPosition,
    MidaPositionDirection,
    MidaPositionStatus, MidaProtection, MidaProtectionChange, MidaUnsupportedOperationError,
} from "@reiryoku/mida";
import { PlaygroundPositionParameters, } from "#platforms/playground/positions/PlaygroundPositionParameters";

export class PlaygroundPosition extends MidaPosition {
    readonly #internalEmitter: MidaEmitter;

    public constructor ({
        id,
        symbol,
        tradingAccount,
        volume,
        direction,
        protection,
        internalEmitter,
    }: PlaygroundPositionParameters) {
        super({
            id,
            symbol,
            volume,
            direction,
            tradingAccount,
            protection,
        });

        this.#internalEmitter = internalEmitter;

        this.#configureListeners();
    }

    public override async getUsedMargin (): Promise<number> {
        if (this.status === MidaPositionStatus.CLOSED) {
            return 0;
        }

        return 0;
    }

    public override async addVolume (volume: number): Promise<MidaOrder> {
        return this.tradingAccount.placeOrder({
            positionId: this.id,
            direction: this.direction === MidaPositionDirection.LONG ? MidaOrderDirection.BUY : MidaOrderDirection.SELL,
            volume: volume,
        });
    }

    public override async subtractVolume (volume: number): Promise<MidaOrder> {
        return this.tradingAccount.placeOrder({
            positionId: this.id,
            direction: this.direction === MidaPositionDirection.LONG ? MidaOrderDirection.SELL : MidaOrderDirection.BUY,
            volume: volume,
        });
    }

    public override async getUnrealizedSwap (): Promise<number> {
        if (this.status === MidaPositionStatus.CLOSED) {
            return 0;
        }

        return 0;
    }

    public override async getUnrealizedCommission (): Promise<number> {
        if (this.status === MidaPositionStatus.CLOSED) {
            return 0;
        }

        return 0;
    }

    public override async getUnrealizedGrossProfit (): Promise<number> {
        if (this.status === MidaPositionStatus.CLOSED) {
            return 0;
        }

        return 0;
    }

    public override async changeProtection (protection: MidaProtection): Promise<MidaProtectionChange> {
        throw new MidaUnsupportedOperationError();
    }

    #configureListeners () {
        this.#internalEmitter.on("trade", (event) => {
            const { trade, } = event.descriptor;

            if (trade.positionId === this.id) {
                this.onTradeExecute(trade);
            }
        });
    }
}
