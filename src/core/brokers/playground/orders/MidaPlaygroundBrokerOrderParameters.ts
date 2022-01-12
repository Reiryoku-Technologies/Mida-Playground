import {MidaBrokerOrderParameters, MidaEmitter} from "@reiryoku/mida";

export type MidaPlaygroundBrokerOrderParameters = MidaBrokerOrderParameters & {
    internalEmitter: MidaEmitter;
};
