import { MidaOrderParameters, MidaEmitter, } from "@reiryoku/mida";

export type PlaygroundOrderParameters = MidaOrderParameters & {
    internalEmitter: MidaEmitter;
};
