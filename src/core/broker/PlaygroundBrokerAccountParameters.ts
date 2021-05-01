import { MidaBroker } from "@reiryoku/mida";

export type PlaygroundBrokerAccountParameters = {
    id: string;
    ownerName: string;
    broker: MidaBroker;
    localDate?: Date;
    currency?: string;
    balance?: number;
    negativeBalanceProtection?: boolean;
    fixedOrderCommission?: number;
    marginCallLevel?: number;
    stopOutLevel?: number;
};
