import { ApiPromise } from "@polkadot/api";
import { CollectionItem, LegalOfficerCase, LogionNodeApiClass, Numbers, UUID } from "../src/index.js";
import { POLKADOT_API_CREATE_TYPE, mockValidAccountId } from "./Util.js";
import { DEFAULT_LEGAL_OFFICER } from "./TestData.js";

describe("Queries", () => {

    it("Getting account data", async () => {
        const accountId = "accountId";
        const api = mockPolkadotApiWithAccountData(accountId);

        const logionApi = new LogionNodeApiClass(api);
        const data = await logionApi.queries.getAccountData(accountId);
    
        expect(data.available).toBe("42");
        expect(data.reserved).toBe("0");
    });
    
    it("Getting balances", async () => {
        const accountId = "accountId";
        const api = mockPolkadotApiWithAccountData(accountId);

        const logionApi = new LogionNodeApiClass(api);
        const data = await logionApi.queries.getCoinBalances(accountId);
    
        const expected = new Numbers.PrefixedNumber("42", Numbers.ATTO);
        expect(data[0].balance).toEqual(expected);
        expect(data[0].coin.id).toBe("lgnt");
        expect(data[0].level).toBe(0.42000000000000004);
    
        expect(data[1].balance).toEqual(new Numbers.PrefixedNumber("0", Numbers.NONE));
        expect(data[1].coin.id).toBe("dot");
        expect(data[1].level).toBe(1);
    });

    it("fetches Logion Legal Officer Case", async () => {
        const api = mockPolkadotApiForLogionLoc();
        const locId = new UUID();

        const logionApi = new LogionNodeApiClass(api);
        const loc = await logionApi.queries.getLegalOfficerCase(locId);

        expect(loc!.owner).toEqual(DEFAULT_LOC.owner);
        expect(loc!.requesterAddress?.address).toEqual(DEFAULT_LOC.requesterAddress?.address);
        expect(loc!.metadata).toEqual(DEFAULT_LOC.metadata);
        expect(loc!.files).toEqual(DEFAULT_LOC.files);
        loc!.links.forEach((link, index) => {
            expect(link.id.toString()).toBe(DEFAULT_LOC.links[index].id.toString());
            expect(link.nature).toBe(DEFAULT_LOC.links[index].nature);
        });
        expect(loc!.closed).toEqual(DEFAULT_LOC.closed);
        expect(loc!.locType).toEqual(DEFAULT_LOC.locType);
        expect(loc!.collectionCanUpload).toBe(DEFAULT_LOC.collectionCanUpload);
    });

    it("fetches collection item", async () => {
        const api = mockPolkadotApiForLogionLoc();
        const locId = new UUID();
        const itemId = "0x91820202c3d0fea0c494b53e3352f1934bc177484e3f41ca2c4bca4572d71cd2";

        const logionApi = new LogionNodeApiClass(api);
        const item = await logionApi.queries.getCollectionItem(locId, itemId);

        expect(item!.id).toEqual(DEFAULT_ITEM.id);
        expect(item!.description).toEqual(DEFAULT_ITEM.description);
        expect(item!.files).toEqual(jasmine.arrayContaining(DEFAULT_ITEM.files));
        expect(item!.token).toEqual(DEFAULT_ITEM.token);
        expect(item!.restrictedDelivery).toEqual(DEFAULT_ITEM.restrictedDelivery);
        expect(item!.termsAndConditions).toEqual(DEFAULT_ITEM.termsAndConditions);
    });

    it("fetched recovery config", async () => {
        const accountId = "account";
        const recoveryConfig = {
            isEmpty: false,
            isNone: false,
            unwrap: () => ({
                friends: {
                    toArray: () => [
                        { toString: () => DEFAULT_LEGAL_OFFICER }
                    ]
                }
            })
        };
        const recoverable = (targetAccountId: string) => targetAccountId === accountId ? Promise.resolve(recoveryConfig) : Promise.reject();
        const api = mockPolkadotApiForRecovery(recoverable);

        const logionApi = new LogionNodeApiClass(api);
        const config = await logionApi.queries.getRecoveryConfig(accountId);

        expect(config).toBeDefined();
        expect(config!.legalOfficers).toEqual([ DEFAULT_LEGAL_OFFICER ]);
    });

    it("fetched active recovery", async () => {
        const accountToRecover = "account1";
        const recoveringAccount = "account2";
        const activeRecovery = {
            isEmpty: false,
            isNone: false,
            unwrap: () => ({
                friends: {
                    toArray: () => [
                        { toString: () => DEFAULT_LEGAL_OFFICER }
                    ]
                }
            })
        };
        const recoverable = (source: string, dest: string) =>
                (source === accountToRecover && dest === recoveringAccount)
                    ? Promise.resolve(activeRecovery)
                    : Promise.reject();
        const api = mockPolkadotApiForRecovery(undefined, recoverable);
        const logionApi = new LogionNodeApiClass(api);
        const recovery = await logionApi.queries.getActiveRecovery(accountToRecover, recoveringAccount);
        expect(recovery).toBeDefined()
        expect(recovery!.legalOfficers).toEqual([ DEFAULT_LEGAL_OFFICER ])
    });
})

function mockPolkadotApiWithAccountData(accountId: string) {
    return {
        query: {
            system: {
                account: (id: string) => id === accountId ? {
                    data: {
                        free: {
                            toString: () => "42",
                            add: () => "42",
                        },
                        reserved: {
                            toString: () => "0"
                        }
                    }
                }: undefined,
            }
        }
    } as unknown as ApiPromise;
}

function mockPolkadotApiForLogionLoc() {
    return {
        query: {
            logionLoc: {
                locMap: () => Promise.resolve({
                    isSome: true,
                    unwrap: () => ({
                        owner: DEFAULT_LOC.owner,
                        requester: {
                            isAccount: true,
                            isLoc: false,
                            isOtherAccount: false,
                            asAccount: {
                                toString: () => DEFAULT_LOC.requesterAddress?.address,
                            },
                            asLoc: {
                                toString: () => undefined
                            }
                        },
                        metadata: {
                            toArray: () => DEFAULT_LOC.metadata.map(item => ({
                                name: {
                                    toUtf8: () => item.name
                                },
                                value: {
                                    toUtf8: () => item.value
                                },
                                submitter: {
                                    isPolkadot: true,
                                    asPolkadot: {
                                        toString: () => item.submitter.address
                                    }
                                }
                            }))
                        },
                        files: {
                            toArray: () => DEFAULT_LOC.files.map(file => ({
                                hash_: {
                                    toHex: () => file.hash
                                },
                                nature: {
                                    toUtf8: () => file.nature
                                },
                                submitter: {
                                    isPolkadot: true,
                                    asPolkadot: {
                                        toString: () => file.submitter.address
                                    }
                                },
                                size_: {
                                    toBigInt: () => file.size
                                },
                            }))
                        },
                        links: {
                            toArray: () => DEFAULT_LOC.links.map(link => ({
                                id: {
                                    toString: () => link.id.toDecimalString()
                                },
                                nature: {
                                    toUtf8: () => link.nature
                                }
                            }))
                        },
                        closed: {
                            isTrue: DEFAULT_LOC.closed,
                            isFalse: !DEFAULT_LOC.closed,
                        },
                        locType: {
                            isTransaction: DEFAULT_LOC.locType === 'Transaction',
                            isIdentity: DEFAULT_LOC.locType === 'Identity',
                            toString: () => DEFAULT_LOC.locType,
                        },
                        voidInfo: {
                            isSome: false
                        },
                        replacerOf: {
                            isSome: false
                        },
                        collectionLastBlockSubmission: {
                            isSome: false
                        },
                        collectionMaxSize: {
                            isSome: false
                        },
                        collectionCanUpload: {
                            isTrue: DEFAULT_LOC.collectionCanUpload,
                            isFalse: !DEFAULT_LOC.collectionCanUpload,
                        },
                        seal: {
                            isSome: DEFAULT_LOC.seal !== undefined,
                            unwrap: () => ({
                                toHex: () => DEFAULT_LOC.seal
                            })
                        },
                        sponsorshipId: {
                            isSome: DEFAULT_LOC.sponsorshipId !== undefined,
                            isNone: DEFAULT_LOC.sponsorshipId === undefined,
                        }
                    })
                }),
                collectionItemsMap: () => Promise.resolve({
                    isSome: true,
                    unwrap: () => ({
                        description: { toUtf8: () =>  DEFAULT_ITEM.description },
                        files: DEFAULT_ITEM.files.map(item => ({
                            name: { toUtf8: () => item.name },
                            contentType: { toUtf8: () => item.contentType },
                            hash_: { toHex: () => item.hash },
                            size_: { toBigInt: () => item.size },
                        })),
                        restrictedDelivery: {
                            isTrue: DEFAULT_ITEM.restrictedDelivery,
                            isFalse: !DEFAULT_ITEM.restrictedDelivery,
                        },
                        termsAndConditions: DEFAULT_ITEM.termsAndConditions.map(tc => ({
                            tcType: { toUtf8: () => tc.tcType },
                            tcLocId: { toString: () => tc.tcLocId.toDecimalString() },
                            details: { toUtf8: () => tc.details },
                        })),
                    })
                }),
            }
        },
        createType: POLKADOT_API_CREATE_TYPE,
    } as unknown as ApiPromise;
}

export const DEFAULT_LOC: LegalOfficerCase = {
    owner: "owner",
    requesterAddress: mockValidAccountId("5FniDvPw22DMW1TLee9N8zBjzwKXaKB2DcvZZCQU5tjmv1kb"),
    metadata: [
        {
            name: "meta_name",
            value: "meta_value",
            submitter: mockValidAccountId("owner"),
        }
    ],
    files: [
        {
            hash: "0x91820202c3d0fea0c494b53e3352f1934bc177484e3f41ca2c4bca4572d71cd2",
            nature: "file-nature",
            submitter: mockValidAccountId("owner"),
            size: BigInt(128000),
        }
    ],
    links: [
        {
            id: new UUID("90fcde7e-a255-404e-8b15-32963a4e64c0"),
            nature: "file-nature"
        }
    ],
    closed: false,
    locType: 'Transaction',
    collectionLastBlockSubmission: undefined,
    collectionMaxSize: undefined,
    collectionCanUpload: false,
    seal: "0x917ec227fc39f3eba7dc3546d714f4146bcbeb496a909316723ada32008de3c8",
}

export const DEFAULT_ITEM: CollectionItem = {
    id: "0x91820202c3d0fea0c494b53e3352f1934bc177484e3f41ca2c4bca4572d71cd2",
    description: "Some description",
    files: [
        {
            name: "artwork.png",
            contentType: "image/png",
            size: BigInt(256000),
            hash: "0x91820202c3d0fea0c494b53e3352f1934bc177484e3f41ca2c4bca4572d71cd2",
        }
    ],
    restrictedDelivery: false,
    termsAndConditions: [],
}

function mockPolkadotApiForRecovery(recoverable?: any, activeRecoveries?: any) {
    return {
        query: {
            recovery: {
                recoverable: recoverable ? recoverable : () => Promise.resolve(),
                activeRecoveries: activeRecoveries ? activeRecoveries : () => Promise.resolve(),
            },
        },
        tx: {
            recovery: {
                initiateRecovery: () => Promise.resolve(),
            },
            verifiedRecovery: {
                createRecovery: () => Promise.resolve(),
            },
        },
    } as unknown as ApiPromise;
}