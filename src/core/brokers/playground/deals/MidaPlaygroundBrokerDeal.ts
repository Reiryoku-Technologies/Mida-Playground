import { MidaBrokerDeal, MidaEmitter } from "@reiryoku/mida";
import { MidaPlaygroundBrokerDealParameters } from "#brokers/playground/deals/MidaPlaygroundBrokerDealParameters";

export class MidaPlaygroundBrokerDeal extends MidaBrokerDeal {
    readonly #internalEmitter: MidaEmitter;

    public constructor ({
        id,
        order,
        position,
        direction,
        status,
        purpose,
        requestDate,
        executionDate,
        rejectionDate,
        closedByDeals,
        closedDeals,
        executionPrice,
        grossProfit,
        commission,
        swap,
        rejectionType,
        internalEmitter,
    }: MidaPlaygroundBrokerDealParameters) {
        super({
            id,
            order,
            position,
            direction,
            status,
            purpose,
            requestDate,
            executionDate,
            rejectionDate,
            closedByDeals,
            closedDeals,
            executionPrice,
            grossProfit,
            commission,
            swap,
            rejectionType,
        });

        this.#internalEmitter = internalEmitter;
    }
}
