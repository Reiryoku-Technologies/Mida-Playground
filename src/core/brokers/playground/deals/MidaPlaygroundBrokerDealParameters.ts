import { MidaBrokerDealParameters, MidaEmitter } from "@reiryoku/mida";

export type MidaPlaygroundBrokerDealParameters = MidaBrokerDealParameters & {
    internalEmitter: MidaEmitter;
};
