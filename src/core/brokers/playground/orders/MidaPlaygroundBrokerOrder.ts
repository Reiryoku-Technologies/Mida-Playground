import {
    MidaBrokerDealDirection,
    MidaBrokerDealPurpose,
    MidaBrokerDealStatus,
    MidaBrokerOrder,
    MidaBrokerOrderStatus,
    MidaBrokerPosition,
    MidaEmitter,
    MidaEvent,
    MidaUtilities
} from "@reiryoku/mida";
import {MidaPlaygroundBrokerOrderParameters} from "#brokers/playground/orders/MidaPlaygroundBrokerOrderParameters";
import {MidaPlaygroundBrokerDeal} from "#brokers/playground/deals/MidaPlaygroundBrokerDeal";
import {MidaPlaygroundBrokerAccount} from "#brokers/playground/MidaPlaygroundBrokerAccount";

export class MidaPlaygroundBrokerOrder extends MidaBrokerOrder {
    readonly #internalEmitter: MidaEmitter;

    public constructor ({
        id,
        brokerAccount,
        symbol,
        requestedVolume,
        direction,
        purpose,
        limitPrice,
        stopPrice,
        status,
        creationDate,
        lastUpdateDate,
        deals,
        timeInForce,
        isStopOut,
        internalEmitter,
    }: MidaPlaygroundBrokerOrderParameters) {
        super({
            id,
            brokerAccount,
            symbol,
            requestedVolume,
            direction,
            purpose,
            limitPrice,
            stopPrice,
            status,
            creationDate,
            lastUpdateDate,
            deals,
            timeInForce,
            isStopOut,
        });

        this.#internalEmitter = internalEmitter;
    }

    get #playgroundBrokerAccount (): MidaPlaygroundBrokerAccount {
        return this.brokerAccount as MidaPlaygroundBrokerAccount;
    }

    public override async cancel (): Promise<void> {
        await this.#playgroundBrokerAccount.cancelPendingOrder(this.id as string);
    }

    #onExecution (event: MidaEvent): void {
        const {
            executionDate,
            executionPrice,
        } = event.descriptor;

        if (this.status !== MidaBrokerOrderStatus.PENDING) {
            this.lastUpdateDate = executionDate.clone();

            this.onStatusChange(MidaBrokerOrderStatus.ACCEPTED);
        }

        this.lastUpdateDate = executionDate.clone();

        this.onDeal(new MidaPlaygroundBrokerDeal({
            id: MidaUtilities.generateUuid(),
            order: this,
            position: {} as MidaBrokerPosition,
            symbol: this.symbol,
            requestedVolume: this.requestedVolume,
            filledVolume: this.requestedVolume,
            direction: MidaBrokerDealDirection.BUY,
            status: MidaBrokerDealStatus.FILLED,
            purpose: MidaBrokerDealPurpose.OPEN,
            requestDate: executionDate.clone(),
            executionDate: executionDate.clone(),
            rejectionDate: undefined,
            closedByDeals: [],
            closedDeals: [],
            executionPrice,
            grossProfit: 0,
            commission: 0,
            swap: 0,
            rejection: undefined,
            internalEmitter: this.#internalEmitter,
        }));
        this.onStatusChange(MidaBrokerOrderStatus.FILLED);
    }

    #onCancel (event: MidaEvent): void {
        const { cancelDate, } = event.descriptor;

        this.lastUpdateDate = cancelDate.clone();
        this.onStatusChange(MidaBrokerOrderStatus.CANCELLED);
    }

    #configureListeners () {
        this.#internalEmitter.on("order-execute", (event: MidaEvent): void => {
            if (event.descriptor.orderId === this.id) {
                this.#onExecution(event);
            }
        });

        this.#internalEmitter.on("order-cancel", (event: MidaEvent): void => {
            if (event.descriptor.orderId === this.id) {
                this.#onCancel(event);
            }
        });
    }
}
