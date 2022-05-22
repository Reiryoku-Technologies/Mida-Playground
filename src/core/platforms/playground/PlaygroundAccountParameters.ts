import { MidaTradingPlatform, MidaDate } from "@reiryoku/mida";

export type PlaygroundAccountParameters = {
    id: string;
    ownerName: string;
    platform: MidaTradingPlatform;
    localDate?: MidaDate;
    depositCurrencyIso?: string;
    balance?: number;
    negativeBalanceProtection?: boolean;
    fixedOrderCommission?: number;
    marginCallLevel?: number;
    stopOutLevel?: number;
};
