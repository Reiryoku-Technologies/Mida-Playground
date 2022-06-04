import { MidaPositionParameters, MidaEmitter, } from "@reiryoku/mida";

export type PlaygroundPositionParameters = MidaPositionParameters & {
    internalEmitter: MidaEmitter;
};
