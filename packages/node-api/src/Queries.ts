import { ApiPromise } from "@polkadot/api";
import { Adapters } from "./Adapters.js";
import * as Currency from "./Currency.js";
import * as Numbers from "./numbers.js";
import { CollectionItem, LegalOfficerCase, TypesAccountData, TypesRecoveryConfig } from "./Types.js";
import { UUID } from "./UUID.js";

export interface Coin {
    id: string,
    name: string,
    iconId: string,
    iconType: 'svg' | 'png',
    symbol: string,
}

export interface CoinBalance {
    coin: Coin,
    balance: Numbers.PrefixedNumber,
    available: Numbers.PrefixedNumber,
    level: number,
}

export const ARTIFICIAL_MAX_BALANCE = Currency.toPrefixedNumberAmount(100n);

export class Queries {
    
    constructor(
        api: ApiPromise,
        adapters: Adapters,
    ) {
        this.api = api;
        this.adapters = adapters;
    }

    private api: ApiPromise;
    private adapters: Adapters;

    isValidAccountId(accountId?: string | null): boolean {
        if(accountId === null || accountId === undefined || accountId === '') {
            return false;
        }
    
        try {
            this.api.createType('AccountId', accountId);
            return true;
        } catch(e) {
            return false;
        }
    }

    async getAccountData(accountId: string): Promise<TypesAccountData> {
        const accountInfo = await this.api.query.system.account(accountId);
        return this.adapters.fromFrameSystemAccountInfo(accountInfo);
    }

    async getCoinBalances(accountId: string): Promise<CoinBalance[]> {
        const accountInfo = await this.api.query.system.account(accountId);
        const data = this.adapters.fromFrameSystemAccountInfo(accountInfo);
    
        const logTotal = Currency.toPrefixedNumberAmount(BigInt(data.total)).optimizeScale(3);
        const logLevel = logTotal.scientificNumber.divideBy(ARTIFICIAL_MAX_BALANCE.convertTo(logTotal.prefix).scientificNumber).toNumber();
        const logAvailable = Currency.toPrefixedNumberAmount(BigInt(data.available)).optimizeScale(3);
    
        return [
            Queries.buildCoinBalance('lgnt', logTotal, logAvailable, logLevel),
            Queries.DOT_BALANCE
        ];
    }

    static readonly DOT_BALANCE = Queries.buildCoinBalance('dot', new Numbers.PrefixedNumber("0", Numbers.NONE), new Numbers.PrefixedNumber("0", Numbers.NONE), 1);

    private static buildCoinBalance(coinId: string, balance: Numbers.PrefixedNumber, available: Numbers.PrefixedNumber, level: number): CoinBalance {
        const coin = Queries.getCoin(coinId);
        return {
            coin,
            balance,
            available,
            level,
        }
    }
    
    static getCoin(coinId: string): Coin {
        if(coinId === 'dot') {
            return {
                id: 'dot',
                name: 'Polkadot',
                iconId: 'dot',
                iconType: 'png',
                symbol: 'DOT',
            };
        } else if(coinId === "lgnt") {
            return {
                id: 'lgnt',
                name: 'logion Token',
                iconId: 'lgnt',
                iconType: 'svg',
                symbol: Currency.SYMBOL,
            };
        } else {
            throw new Error(`Unsupported coin ${coinId}`);
        }
    }

    async getLegalOfficerCase(locId: UUID): Promise<LegalOfficerCase | undefined> {
        const result = await this.api.query.logionLoc.locMap(locId.toHexString());
        if(result.isSome) {
            return Adapters.fromPalletLogionLocLegalOfficerCase(result.unwrap());
        } else {
            return undefined;
        }
    }

    async getLegalOfficerCases(locIds: UUID[]): Promise<(LegalOfficerCase | undefined)[]> {
        const result = await this.api.query.logionLoc.locMap.multi(locIds.map(id => id.toHexString()));
        const locs: (LegalOfficerCase | undefined)[] = [];
        for(let i = 0; i < result.length; ++i) {
            const option = result[i];
            if(option.isSome) {
                locs.push(Adapters.fromPalletLogionLocLegalOfficerCase(option.unwrap()));
            } else {
                locs.push(undefined);
            }
        }
        return locs;
    }

    async getLegalOfficerCasesMap(locIds: UUID[]): Promise<Record<string, LegalOfficerCase>> {
        const locs = await this.getLegalOfficerCases(locIds);
        const map: Record<string, LegalOfficerCase> = {};
        for(let i = 0; i < locs.length; ++i) {
            const loc = locs[i];
            const locId = locIds[i];
            if(loc !== undefined) {
                map[locId.toDecimalString()] = loc;
            }
        }
        return map;
    }

    async getCollectionItem(locId: UUID, itemId: string): Promise<CollectionItem | undefined> {
        const result = await this.api.query.logionLoc.collectionItemsMap(Adapters.toLocId(locId), itemId);
        if(result.isSome) {
            return Adapters.fromPalletCollectionItem(itemId, result.unwrap());
        } else {
            return undefined;
        }
    }

    async getCollectionItems(locId: UUID): Promise<CollectionItem[]> {
        const result = await this.api.query.logionLoc.collectionItemsMap.entries(Adapters.toLocId(locId));
        return result.map(entry => Adapters.fromPalletCollectionItem(entry[0].args[1].toString(), entry[1].unwrap()));
    }

    async getCollectionSize(locId: UUID): Promise<number | undefined> {
        const result = await this.api.query.logionLoc.collectionSizeMap(Adapters.toLocId(locId));
        if (result.isSome) {
            return result.unwrap().toNumber();
        } else {
            return undefined;
        }
    }

    async getRecoveryConfig(accountId: string): Promise<TypesRecoveryConfig | undefined> {
        const recoveryConfig = await this.api.query.recovery.recoverable(accountId);
        if (recoveryConfig.isEmpty) {
            return undefined
        }
        return {
            legalOfficers: recoveryConfig.unwrap().friends.toArray().map(accountId => accountId.toString())
        };
    }

    async getActiveRecovery(sourceAccount: string, destinationAccount: string): Promise<TypesRecoveryConfig | undefined> {
        const activeRecovery = await this.api.query.recovery.activeRecoveries(sourceAccount, destinationAccount);
        if (activeRecovery.isEmpty) {
            return undefined
        }
        return {
            legalOfficers: activeRecovery.unwrap().friends.toArray().map(accountId => accountId.toString())
        };
    }

    async getProxy(address: string): Promise<string | undefined> {
        const proxy = await this.api.query.recovery.proxy(address);
        if (proxy.isEmpty) {
            return undefined
        }
        return proxy.unwrap().toString();
    }
}
