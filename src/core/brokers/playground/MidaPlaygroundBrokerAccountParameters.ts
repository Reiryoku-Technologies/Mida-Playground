import { MidaBroker, MidaDate } from "@reiryoku/mida";

export type MidaPlaygroundBrokerAccountParameters = {
    id: string;
    ownerName: string;
    broker: MidaBroker;
    localDate?: MidaDate;
    depositCurrencyIso?: string;
    balance?: number;
    negativeBalanceProtection?: boolean;
    fixedOrderCommission?: number;
    marginCallLevel?: number;
    stopOutLevel?: number;
};
