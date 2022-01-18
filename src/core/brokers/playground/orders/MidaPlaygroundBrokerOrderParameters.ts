import {MidaBrokerOrderParameters, MidaEmitter} from "@reiryoku/mida";

export type MidaPlaygroundBrokerOrderParameters = MidaBrokerOrderParameters & {
    brokerEmitter: MidaEmitter;
};
