import { MidaTrade, MidaTradeParameters, } from "@reiryoku/mida";

export class PlaygroundTrade extends MidaTrade {
    public constructor (parameters: MidaTradeParameters) {
        super(parameters);
    }
}
