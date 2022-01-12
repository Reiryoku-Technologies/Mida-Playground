import {MidaBrokerDeal, MidaEmitter} from "@reiryoku/mida";
import {MidaPlaygroundBrokerDealParameters} from "#brokers/playground/deals/MidaPlaygroundBrokerDealParameters";

export class MidaPlaygroundBrokerDeal extends MidaBrokerDeal {
    readonly #internalEmitter: MidaEmitter;

    public constructor ({
        id,
        order,
        position,
        symbol,
        requestedVolume,
        filledVolume,
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
        rejection,
        internalEmitter,
    }: MidaPlaygroundBrokerDealParameters) {
        super({
            id,
            order,
            position,
            symbol,
            requestedVolume,
            filledVolume,
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
            rejection,
        });

        this.#internalEmitter = internalEmitter;
    }
}
