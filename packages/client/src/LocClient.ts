import {
    LogionNodeApiClass,
    UUID,
    LocType,
    LegalOfficerCase,
    ItemFile,
    CollectionItem,
    ValidAccountId,
    AccountType,
    LocBatch,
    Adapters,
    TypesTokensRecord,
    TypesTokensRecordFile,
    FileParams,
    Link,
    VoidInfo,
    Hash,
} from '@logion/node-api';
import type { SubmittableExtrinsic } from '@polkadot/api/promise/types';
import { AnyJson } from "@polkadot/types-codec/types";
import { AxiosInstance } from 'axios';
import { HexString } from "@polkadot/util/types";

import { UserIdentity, LegalOfficer, PostalAddress, LegalOfficerClass } from "./Types.js";
import { NetworkState } from "./NetworkState.js";
import { authenticatedCurrentAddress, LegalOfficerEndpoint, SharedState } from "./SharedClient.js";
import { AxiosFactory } from "./AxiosFactory.js";
import { requireDefined } from "./assertions.js";
import { initMultiSourceHttpClientState, MultiSourceHttpClient, aggregateArrays, Token } from "./Http.js";
import { Signer, SignCallback } from "./Signer.js";
import { ComponentFactory } from "./ComponentFactory.js";
import { newBackendError } from "./Error.js";
import { HashOrContent, HashString } from "./Hash.js";
import { MimeType } from "./Mime.js";
import { validateToken, ItemTokenWithRestrictedType, TokenType } from "./Token.js";
import {
    TermsAndConditionsElement,
    newTermsAndConditions,
    LogionClassification,
    SpecificLicense,
    CreativeCommons,
    OffchainTermsAndConditionsElement,
    MergedTermsAndConditionsElement
} from "./license/index.js";
import { CollectionDelivery, ItemDeliveries } from './Deliveries.js';
import { Fees } from './Fees.js';

export interface AddedOn {
    addedOn: string;
}

export interface Published {
    published: boolean;
}

export interface SupportedAccountId {
    type: AccountType;
    address: string;
}

export type ItemStatus = "DRAFT" | "REVIEW_PENDING" | "REVIEW_ACCEPTED" | "REVIEW_REJECTED" | "PUBLISHED" | "ACKNOWLEDGED";

/**
 * Backend LOC file.
 */
export interface LocFile extends Partial<AddedOn> {
    hash: string;
    nature: string;
    submitter: SupportedAccountId;
    name: string;
    restrictedDelivery: boolean;
    contentType: string;
    fees?: Fees;
    storageFeePaidBy?: string;
    status: ItemStatus;
    rejectReason?: string;
    reviewedOn?: string;
    size: string;
}

/**
 * Backend MetadataItem.
 */
export interface LocMetadataItem extends Partial<AddedOn> {
    name: string;
    nameHash: string;
    value: string;
    submitter: SupportedAccountId;
    fees?: Fees;
    status: ItemStatus;
    rejectReason?: string;
    reviewedOn?: string;
}

/**
 * Backend LocLink.
 */
export interface LocLink extends AddedOn {
    target: string;
    nature: string;
    fees?: Fees;
}

export interface LocCollectionItem extends AddedOn {
    itemId: string,
}

export interface LocRequestVoidInfo {
    reason?: string; // undefined in public view
    voidedOn?: string;
}

export interface VerifiedIssuer {
    firstName: string;
    lastName: string;
    identityLocId: string;
    address: string;
    selected?: boolean;
}

export interface LocVerifiedIssuers {
    verifiedIssuer: boolean;
    issuers: VerifiedIssuer[];
}

export interface LocRequest {
    ownerAddress: string;
    requesterAddress?: SupportedAccountId;
    requesterIdentityLoc?: string | null;
    description: string;
    locType: LocType;
    createdOn: string;
    decisionOn?: string;
    id: string;
    status: LocRequestStatus;
    rejectReason?: string;
    identityLoc?: string;
    userIdentity?: UserIdentity;
    userPostalAddress?: PostalAddress;
    closedOn?: string;
    files: LocFile[];
    metadata: LocMetadataItem[];
    links: LocLink[];
    voidInfo?: LocRequestVoidInfo;
    seal?: string;
    company?: string;
    iDenfy?: IdenfyVerificationSession;
    voteId?: string | null;
    selectedIssuers: VerifiedIssuerIdentity[];
    template?: string;
    sponsorshipId?: string;
}

export interface IdenfyVerificationSession {
    status: IdenfySessionStatus;
    redirectUrl?: string;
}

export type IdenfySessionStatus = "APPROVED" | "DENIED" | "SUSPECTED" | "EXPIRED" | "PENDING";

export type LocRequestStatus = "DRAFT" | "REVIEW_PENDING" | "REVIEW_REJECTED" | "REVIEW_ACCEPTED" | "OPEN" | "CLOSED";

export interface FetchParameters {
    locId: UUID,
}

export interface HasJwtToken {
    jwtToken?: Token
}

export interface GetTokensRecordsRequest extends FetchParameters, HasJwtToken {
}

export interface AddMetadataParams {
    name: string,
    value: string,
}

export interface DeleteMetadataParams {
    nameHash: Hash,
}

export interface AddFileParams {
    file: HashOrContent,
    fileName: string,
    nature: string,
}

export interface DeleteFileParams {
    hash: Hash;
}

export interface AddLinkParams {
    target: UUID;
    nature: string;
}

export interface DeleteLinkParams {
    target: UUID;
}

export class ItemFileWithContent {

    constructor(parameters: {
        name: string;
        contentType: MimeType;
        size?: bigint;
        hashOrContent: HashOrContent;
    }) {
        this._name = parameters.name;
        this._contentType = parameters.contentType;
        this._hashOrContent = parameters.hashOrContent;
        this._size = parameters.size;

        if (!this._size && !this._hashOrContent.hasContent) {
            throw new Error("File size must be provided if no content is");
        }
    }

    private _name: string;
    private _contentType: MimeType;
    private _size?: bigint;
    private _hashOrContent: HashOrContent;

    async finalize() {
        await this._hashOrContent.finalize();
        if(this._hashOrContent.hasContent) {
            const contentSize = this._hashOrContent.size;
            if(!this._size) {
                this._size = contentSize;
            } else if(this._size !== contentSize) {
                throw new Error(`Given size does not match content: got ${this._size}, should be ${contentSize}`);
            }
        }
    }

    get name() {
        return this._name;
    }

    get contentType() {
        return this._contentType;
    }

    get size() {
        if(!this._size) {
            throw new Error("Call finalize() first");
        }
        return this._size;
    }

    get hashOrContent() {
        return this._hashOrContent;
    }
}

export interface BlockchainSubmissionParams {
    signer: Signer;
    callback?: SignCallback;
}

export interface AddCollectionItemParams extends BlockchainSubmissionParams {
    itemId: Hash,
    itemDescription: string,
    itemFiles?: ItemFileWithContent[],
    itemToken?: ItemTokenWithRestrictedType,
    restrictedDelivery?: boolean,
    logionClassification?: LogionClassification,
    specificLicenses?: SpecificLicense[],
    creativeCommons?: CreativeCommons,
}

export interface FetchLocRequestSpecification {
    ownerAddress?: string;
    requesterAddress?: string,
    statuses: LocRequestStatus[],
    locTypes: LocType[],
    sponsorshipId?: string;
}

export interface CreateLocRequest {
    ownerAddress: string;
    description: string;
    locType: LocType;
    userIdentity?: UserIdentity;
    userPostalAddress?: PostalAddress;
    company?: string;
    draft?: boolean;
    template?: string;
    sponsorshipId?: string;
    requesterAddress?: SupportedAccountId;
    requesterIdentityLoc?: string;
}

export interface CreateSofRequest {
    itemId?: Hash;
}

export interface GetDeliveriesRequest {
    locId: UUID;
    itemId: Hash;
}

export interface CheckCollectionDeliveryRequest {
    locId: UUID;
    hash: Hash;
}

export interface FetchAllLocsParams {
    legalOfficers?: LegalOfficer[];
    spec?: FetchLocRequestSpecification;
}

export interface VerifiedIssuerIdentity {
    address: string;
    identity: UserIdentity;
    identityLocId: string;
    selected?: boolean;
}

export interface AddTokensRecordParams extends  BlockchainSubmissionParams {
    recordId: Hash,
    description: string,
    files: ItemFileWithContent[],
}

export interface GetTokensRecordDeliveriesRequest {
    locId: UUID;
    recordId: Hash;
}

export interface CheckTokensRecordDeliveryRequest {
    locId: UUID;
    recordId: Hash;
    hash: Hash;
}

export class LocMultiClient {

    static newLocMultiClient(sharedState: SharedState): LocMultiClient {
        const { currentAddress, token } = authenticatedCurrentAddress(sharedState);
        return new LocMultiClient({
            axiosFactory: sharedState.axiosFactory,
            currentAddress: currentAddress,
            networkState: sharedState.networkState,
            token: token.value,
            nodeApi: sharedState.nodeApi,
            componentFactory: sharedState.componentFactory,
        });
    }

    constructor(params: {
        networkState: NetworkState<LegalOfficerEndpoint>,
        axiosFactory: AxiosFactory,
        currentAddress: ValidAccountId,
        token: string,
        nodeApi: LogionNodeApiClass,
        componentFactory: ComponentFactory,
    }) {
        this.networkState = params.networkState;
        this.axiosFactory = params.axiosFactory;
        this.currentAddress = params.currentAddress;
        this.token = params.token;
        this.nodeApi = params.nodeApi;
        this.componentFactory = params.componentFactory;
    }

    private readonly networkState: NetworkState<LegalOfficerEndpoint>;

    private readonly axiosFactory: AxiosFactory;

    private readonly currentAddress: ValidAccountId;

    private readonly token: string;

    private readonly nodeApi: LogionNodeApiClass;

    private readonly componentFactory: ComponentFactory;

    newLocClient(legalOfficer: LegalOfficerClass) {
        return new AuthenticatedLocClient({
            axiosFactory: this.axiosFactory,
            currentAddress: this.currentAddress,
            nodeApi: this.nodeApi,
            legalOfficer,
            componentFactory: this.componentFactory,
        });
    }

    async fetchAll(params?: FetchAllLocsParams): Promise<LocRequest[]> {
        const initialState = initMultiSourceHttpClientState(this.networkState, params?.legalOfficers);

        const httpClient = new MultiSourceHttpClient<LegalOfficerEndpoint>(
            initialState,
            this.axiosFactory,
            this.token
        );

        const defaultSpec: FetchLocRequestSpecification = {
            requesterAddress: this.currentAddress.address,
            locTypes: [ "Transaction", "Collection", "Identity" ],
            statuses: [ "OPEN", "REVIEW_PENDING", "REVIEW_ACCEPTED", "REVIEW_REJECTED", "CLOSED", "DRAFT" ]
        };

        const multiResponse = await httpClient.fetch(async axios => {
            const specs: FetchLocRequestSpecification = params?.spec ? params?.spec : defaultSpec;
            const response = await axios.put("/api/loc-request", specs);
            return response.data.requests;
        });

        return aggregateArrays<LocRequest>(multiResponse);
    }

    async fetchAllForVerifiedIssuer(legalOfficers: LegalOfficerClass[]): Promise<LocRequest[]> {
        if (this.currentAddress.type !== "Polkadot") {
            return [];
        }
        const entries = await this.nodeApi.polkadot.query.logionLoc.locsByVerifiedIssuerMap.entries(this.currentAddress.address);
        const requests: LocRequest[] = [];
        for(const entry of entries) {
            const owner = entry[0].args[1].toString();
            const locId = UUID.fromDecimalStringOrThrow(entry[0].args[2].toString());
            const legalOfficer = requireDefined(legalOfficers.find(legalOfficer => legalOfficer.address === owner));
            const request = await this.newLocClient(legalOfficer).getLocRequest({ locId });
            requests.push(request);
        }
        return requests;
    }

    async getLoc(parameters: FetchParameters): Promise<LegalOfficerCase> {
        return LocMultiClient.getLoc({
            ...parameters,
            api: this.nodeApi,
        });
    }

    static async getLoc(params: { api: LogionNodeApiClass, locId: UUID }): Promise<LegalOfficerCase> {
        return requireDefined(await params.api.queries.getLegalOfficerCase(params.locId),
            () => new Error(`LOC not found on chain: ${ params.locId.toDecimalString() }`)
        );
    }

    static async getLocBatch(params: { api: LogionNodeApiClass, locIds: UUID[] }): Promise<LocBatch> {
        const { api, locIds } = params;
        return api.batch.locs(locIds);
    }

    async getLocBatch(locIds: UUID[]): Promise<LocBatch> {
        return LocMultiClient.getLocBatch({ api: this.nodeApi, locIds });
    }
}

export interface UploadableCollectionItem {
    id: Hash;
    description: HashString;
    addedOn: string;
    files: UploadableItemFile[];
    token?: ClientToken,
    restrictedDelivery: boolean;
    termsAndConditions: MergedTermsAndConditionsElement[],
}

export class ClientToken {

    constructor(params: { type: HashString, id: HashString, issuance: bigint }) {
        this.type = params.type;
        this.id = params.id;
        this.issuance = params.issuance;
    }

    readonly type: HashString;
    readonly id: HashString;
    readonly issuance: bigint;

    isValidItemTokenWithRestrictedType() {
        return this.type.isValidValue() && this.id.isValidValue();
    }

    toItemTokenWithRestrictedType(): ItemTokenWithRestrictedType {
        const type = this.type.validValue();
        const id = this.id.validValue();
        return {
            id,
            type: type as TokenType,
            issuance: this.issuance,
        };
    }    
}

export interface ClientItemFile {
    name: HashString;
    contentType: HashString;
    size: bigint;
    hash: Hash;
}

export interface UploadableItemFile extends ClientItemFile {
    uploaded: boolean;
}

export interface OffchainCollectionItem {
    collectionLocId: string;
    itemId: string;
    addedOn: string;
    description?: string;
    files: OffchainCollectionItemFile[];
    termsAndConditions: OffchainTermsAndConditionsElement[];
    token?: OffchainCollectionItemToken;
}

export interface OffchainCollectionItemFile {
    hash: string;
    name?: string;
    contentType?: string;
    uploaded?: boolean;
}

export interface OffchainCollectionItemToken {
    type?: string;
    id?: string;
}

interface CreateOffchainCollectionItem {
    itemId: string;
    description: string;
    files: OffchainCollectionItemFile[];
    termsAndConditions: OffchainTermsAndConditionsElement[];
    token?: OffchainCollectionItemToken;
}

export interface ClientTokensRecord {
    id: Hash;
    description: HashString;
    addedOn: string;
    files: UploadableItemFile[];
    issuer: string;
}

export interface OffchainTokensRecord {
    collectionLocId: string;
    recordId: string;
    description: string;
    addedOn: string;
    files: OffchainTokensRecordFile[];
}

interface CreateOffchainTokensRecord {
    recordId: string;
    description: string;
    files: OffchainTokensRecordFile[];
}

export interface OffchainTokensRecordFile {
    hash: string;
    name?: string;
    contentType?: string;
    uploaded?: boolean;
}

export abstract class LocClient {

    constructor(params: {
        axiosFactory: AxiosFactory,
        nodeApi: LogionNodeApiClass,
        legalOfficer: LegalOfficerClass,
    }) {
        this.axiosFactory = params.axiosFactory;
        this.nodeApi = params.nodeApi;
        this.legalOfficer = params.legalOfficer;
    }

    protected readonly axiosFactory: AxiosFactory;
    protected readonly nodeApi: LogionNodeApiClass;
    protected readonly legalOfficer: LegalOfficerClass;

    async getLoc(parameters: FetchParameters): Promise<LegalOfficerCase> {
        return LocMultiClient.getLoc({ ...parameters, api: this.nodeApi });
    }

    backend(): AxiosInstance {
        return this.legalOfficer.buildAxiosToNode();
    }

    async getCollectionItem(parameters: { itemId: Hash } & FetchParameters): Promise<UploadableCollectionItem | undefined> {
        const { locId, itemId } = parameters;
        const onchainItem = await this.nodeApi.queries.getCollectionItem(locId, itemId);
        if(!onchainItem) {
            return undefined;
        }
        try {
            const offchainItem = await this.getOffchainItem({ locId, itemId });
            return this.mergeItems(onchainItem, offchainItem);
        } catch(e) {
            throw newBackendError(e);
        }
    }

    private async getOffchainItem(parameters: { locId: UUID, itemId: Hash }): Promise<OffchainCollectionItem> {
        const { locId, itemId } = parameters;
        const response = await this.backend().get(`/api/collection/${ locId.toString() }/items/${ itemId.toHex() }`);
        return response.data;
    }

    private mergeItems(onchainItem: CollectionItem, offchainItem: OffchainCollectionItem): UploadableCollectionItem {
        return {
            id: onchainItem.id,
            description: new HashString(onchainItem.description, offchainItem.description),
            addedOn: offchainItem.addedOn,
            files: onchainItem.files.map(file => ({
                hash: file.hash,
                size: file.size,
                name: new HashString(file.name, offchainItem.files.find(offchainFile => offchainFile.hash === file.hash.toHex())?.name),
                contentType: new HashString(file.contentType, offchainItem.files.find(offchainFile => offchainFile.hash === file.hash.toHex())?.contentType),
                uploaded: offchainItem.files.find(offchainFile => offchainFile.hash === file.hash.toHex())?.uploaded || false,
            })),
            token: onchainItem.token ? new ClientToken({
                type: new HashString(onchainItem.token.type, offchainItem.token?.type),
                id: new HashString(onchainItem.token.id, offchainItem.token?.id),
                issuance: onchainItem.token.issuance,
            }) : undefined,
            restrictedDelivery: onchainItem.restrictedDelivery,
            termsAndConditions: newTermsAndConditions(onchainItem.termsAndConditions, offchainItem.termsAndConditions),
        }
    }

    async getCollectionItems(parameters: FetchParameters): Promise<UploadableCollectionItem[]> {
        const { locId } = parameters;
        const onchainItems = await this.nodeApi.queries.getCollectionItems(locId);

        const onchainItemsMap: Record<string, CollectionItem> = {};
        for(const item of onchainItems) {
            onchainItemsMap[item.id.toHex()] = item;
        }

        try {
            const offchainItems = await this.getOffchainItems({ locId });

            const offchainItemsMap: Record<string, OffchainCollectionItem> = {};
            for(const item of offchainItems) {
                offchainItemsMap[item.itemId] = item;
            }

            return offchainItems.map(item => this.mergeItems(onchainItemsMap[item.itemId], offchainItemsMap[item.itemId]));
        } catch(e) {
            throw newBackendError(e);
        }
    }

    private async getOffchainItems(parameters: { locId: UUID }): Promise<OffchainCollectionItem[]> {
        const { locId } = parameters;
        const response = await this.backend().get(`/api/collection/${ locId.toString() }`);
        return response.data.items;
    }

    async getCollectionSize(parameters: FetchParameters): Promise<number | undefined> {
        const { locId } = parameters;
        return await this.nodeApi.queries.getCollectionSize(locId);
    }

    async getTokensRecord(parameters: { recordId: Hash } & FetchParameters): Promise<ClientTokensRecord | undefined> {
        const { locId, recordId } = parameters;
        const onchainRecord = await this.nodeApi.polkadot.query.logionLoc.tokensRecordsMap(
            this.nodeApi.adapters.toNonCompactLocId(locId),
            this.nodeApi.adapters.toH256(recordId),
        );
        if(onchainRecord.isNone) {
            return undefined;
        }
        try {
            const offchainRecord = await this.getOffchainRecord({ locId, recordId });
            return this.mergeRecords(Adapters.toTokensRecord(onchainRecord.unwrap()), offchainRecord);
        } catch(e) {
            throw newBackendError(e);
        }
    }

    private async getOffchainRecord(parameters: { locId: UUID, recordId: Hash }): Promise<OffchainTokensRecord> {
        const { locId, recordId } = parameters;
        const response = await this.backend().get(`/api/records/${ locId.toString() }/record/${ recordId.toHex() }`);
        return response.data;
    }

    private mergeRecords(onchainItem: TypesTokensRecord, offchainItem: OffchainTokensRecord): ClientTokensRecord {
        return {
            id: Hash.fromHex(offchainItem.recordId as HexString),
            description: new HashString(onchainItem.description, offchainItem.description),
            addedOn: offchainItem.addedOn,
            issuer: onchainItem.submitter,
            files: onchainItem.files.map(file => ({
                hash: file.hash,
                name: new HashString(file.name, offchainItem.files.find(offchainFile => offchainFile.hash === file.hash.toHex())?.name),
                contentType: new HashString(file.contentType, offchainItem.files.find(offchainFile => offchainFile.hash === file.hash.toHex())?.contentType),
                size: BigInt(file.size),
                uploaded: offchainItem.files.find(offchainFile => offchainFile.hash === file.hash.toHex())?.uploaded || false,
            })),
        }
    }

    async getTokensRecords(parameters: GetTokensRecordsRequest): Promise<ClientTokensRecord[]> {
        const { locId } = parameters;
        const onchainRecords = await this.nodeApi.polkadot.query.logionLoc.tokensRecordsMap.entries(locId.toDecimalString());

        const onchainRecordsMap: Record<string, TypesTokensRecord> = {};
        for(const entry of onchainRecords) {
            onchainRecordsMap[entry[0].args[1].toHex()] = Adapters.toTokensRecord(entry[1].unwrap());
        }

        try {
            const offchainTokenRecords = await this.getOffchainTokensRecords(parameters);

            const offchainRecordsMap: Record<string, OffchainTokensRecord> = {};
            for(const item of offchainTokenRecords) {
                offchainRecordsMap[item.recordId] = item;
            }

            return offchainTokenRecords.map(item => this.mergeRecords(onchainRecordsMap[item.recordId], offchainRecordsMap[item.recordId]));
        } catch(e) {
            throw newBackendError(e);
        }
    }

    private async getOffchainTokensRecords(parameters: GetTokensRecordsRequest): Promise<OffchainTokensRecord[]> {
        const { locId, jwtToken } = parameters;
        const axios = jwtToken !== undefined ?
            this.axiosFactory.buildAxiosInstance(this.legalOfficer.node, jwtToken.value) :
            this.backend();
        const response = await axios.get(`/api/records/${ locId.toString() }`);
        return response.data.records;
    }

    abstract getLocRequest(parameters: FetchParameters): Promise<LocRequest>;

    abstract getDeliveries(parameters: GetDeliveriesRequest): Promise<ItemDeliveries>;

    abstract checkDelivery(parameters: CheckCollectionDeliveryRequest): Promise<CollectionDelivery>;

    abstract getTokensRecordDeliveries(parameters: GetTokensRecordDeliveriesRequest): Promise<ItemDeliveries>;

    abstract checkTokensRecordDelivery(parameters: CheckTokensRecordDeliveryRequest): Promise<CollectionDelivery>;
}

export class PublicLocClient extends LocClient {

    override async getLocRequest(parameters: FetchParameters): Promise<LocRequest> {
        const { locId } = parameters;
        const response = await this.backend().get(`/api/loc-request/${ locId.toString() }/public`);
        return response.data;
    }

    override async getDeliveries(parameters: GetDeliveriesRequest): Promise<ItemDeliveries> {
        const { locId, itemId } = parameters;
        const response = await this.backend().get(`/api/collection/${ locId }/${ itemId.toHex() }/latest-deliveries`);
        return response.data;
    }

    override async checkDelivery(parameters: CheckCollectionDeliveryRequest): Promise<CollectionDelivery> {
        const { locId, hash } = parameters;
        const response = await this.backend().put(`/api/collection/${ locId }/file-deliveries`, { copyHash: hash.toHex() });
        return response.data;
    }

    override async getTokensRecordDeliveries(parameters: GetTokensRecordDeliveriesRequest): Promise<ItemDeliveries> {
        return getTokensRecordDeliveries(this.backend(), parameters);
    }

    override async checkTokensRecordDelivery(parameters: CheckTokensRecordDeliveryRequest): Promise<CollectionDelivery> {
        return checkTokensRecordDelivery(this.backend(), parameters);
    }
}

async function getTokensRecordDeliveries(axios: AxiosInstance, parameters: GetTokensRecordDeliveriesRequest): Promise<ItemDeliveries> {
    const { locId, recordId } = parameters;
    const response = await axios.get(`/api/records/${ locId }/${ recordId.toHex() }/deliveries`);
    return response.data;
}

async function checkTokensRecordDelivery(axios: AxiosInstance, parameters: CheckTokensRecordDeliveryRequest): Promise<CollectionDelivery> {
    try {
        const { locId, recordId, hash } = parameters;
        const response = await axios.put(`/api/records/${ locId }/${ recordId.toHex() }/deliveries/check`, { copyHash: hash.toHex() });
        return response.data;
    } catch(e) {
        throw newBackendError(e);
    }
}

export class AuthenticatedLocClient extends LocClient {

    constructor(params: {
        axiosFactory: AxiosFactory,
        currentAddress: ValidAccountId,
        nodeApi: LogionNodeApiClass,
        legalOfficer: LegalOfficerClass,
        componentFactory: ComponentFactory,
    }) {
        super({
            axiosFactory: params.axiosFactory,
            legalOfficer: params.legalOfficer,
            nodeApi: params.nodeApi,
        });
        this.currentAddress = params.currentAddress;
        this.componentFactory = params.componentFactory;
    }

    private readonly currentAddress: ValidAccountId;
    private readonly componentFactory: ComponentFactory;

    async createLocRequest(request: CreateLocRequest): Promise<LocRequest> {
        try {
            const response = await this.backend().post(`/api/loc-request`, request);
            return response.data;
        } catch(e) {
            throw newBackendError(e);
        }
    }

    async createSofRequest(request: CreateSofRequest & FetchParameters): Promise<LocRequest> {
        const { locId, itemId } = request;
        const response = await this.backend().post(`/api/loc-request/sof`, {
            locId: locId.toString(),
            itemId: itemId?.toHex(),
        });
        return response.data;
    }

    override async getLocRequest(parameters: FetchParameters): Promise<LocRequest> {
        try {
            const { locId } = parameters;
            const response = await this.backend().get(`/api/loc-request/${ locId.toString() }`);
            return response.data;
        } catch(e) {
            throw newBackendError(e);
        }
    }

    async addMetadata(parameters: AddMetadataParams & FetchParameters): Promise<void> {
        try {
            const { name, value, locId } = parameters;
            await this.backend().post(`/api/loc-request/${ locId.toString() }/metadata`, { name, value });
        } catch(e) {
            throw newBackendError(e);
        }
    }

    async deleteMetadata(parameters: DeleteMetadataParams & FetchParameters): Promise<void> {
        try {
            const { nameHash, locId } = parameters;
            await this.backend().delete(`/api/loc-request/${ locId.toString() }/metadata/${ nameHash.toHex() }`);
        } catch(e) {
            throw newBackendError(e);
        }
    }

    async addFile(parameters: AddFileParams & FetchParameters): Promise<void> {
        const { file, fileName, nature, locId } = parameters;

        await file.finalize();

        const formData = this.componentFactory.buildFormData();
        formData.append('file', await file.data(), fileName);
        formData.append('nature', nature);
        formData.append('hash', file.contentHash.toHex());

        try {
            await this.backend().post(
                `/api/loc-request/${ locId.toString() }/files`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
        } catch(e) {
            throw newBackendError(e);
        }
    }

    async deleteFile(parameters: DeleteFileParams & FetchParameters): Promise<void> {
        try {
            const { hash, locId } = parameters;
            await this.backend().delete(`/api/loc-request/${ locId.toString() }/files/${ hash.toHex() }`);
        } catch(e) {
            throw newBackendError(e);
        }
    }

    async addLink(parameters: AddLinkParams & FetchParameters): Promise<void> {
        const { target, nature, locId } = parameters;
        try {
            await this.backend().post(`/api/loc-request/${ locId.toString() }/links`, { target: target.toString(), nature });
        } catch(e) {
            throw newBackendError(e);
        }
    }

    async deleteLink(parameters: DeleteLinkParams & FetchParameters): Promise<void> {
        try {
            const { target, locId } = parameters;
            await this.backend().delete(`/api/loc-request/${ locId.toString() }/links/${ target.toString() }`);
        } catch(e) {
            throw newBackendError(e);
        }
    }

    async addCollectionItem(parameters: AddCollectionItemParams & FetchParameters): Promise<void> {
        const {
            itemId,
            itemDescription,
            signer,
            callback,
            locId,
            itemFiles,
            itemToken,
            restrictedDelivery,
        } = parameters;

        const booleanRestrictedDelivery = restrictedDelivery !== undefined ? restrictedDelivery : false;

        const chainItemFiles: ItemFile[] = [];
        if(itemFiles) {
            for(const itemFile of itemFiles) {
                await itemFile.finalize(); // Ensure hash and size
            }
            for(const itemFile of itemFiles) {
                chainItemFiles.push({
                    name: Hash.of(itemFile.name),
                    contentType: Hash.of(itemFile.contentType.mimeType),
                    hash: itemFile.hashOrContent.contentHash,
                    size: itemFile.size,
                });
            }
        }

        if(booleanRestrictedDelivery
            && (chainItemFiles.length === 0 || !itemToken)) {
            throw new Error("Restricted delivery requires a defined underlying token as well as at least one file");
        }

        if(itemToken) {
            this.validTokenOrThrow(itemToken);
        }

        const termsAndConditions: TermsAndConditionsElement[] = [];
        if (parameters.logionClassification && parameters.creativeCommons) {
            throw new Error("Logion Classification and Creative Commons are mutually exclusive.");
        } else if(parameters.logionClassification) {
            termsAndConditions.push(parameters.logionClassification);
        } else if (parameters.creativeCommons) {
            termsAndConditions.push(parameters.creativeCommons);
        }
        if(parameters.specificLicenses) {
            parameters.specificLicenses.forEach(specific => termsAndConditions.push(specific));
        }

        await this.submitItemPublicData(locId, {
            itemId: itemId.toHex(),
            files: itemFiles?.map(file => ({
                name: file.name,
                contentType: file.contentType.mimeType,
                hash: file.hashOrContent.contentHash.toHex(),
            })) || [],
            termsAndConditions: termsAndConditions.map(element => ({
                type: element.type,
                details: element.details,
            })),
            description: itemDescription,
            token: itemToken ? {
                id: itemToken.id,
                type: itemToken.type,
            } : undefined,
        });

        const submittable = this.nodeApi.polkadot.tx.logionLoc.addCollectionItem(
            this.nodeApi.adapters.toLocId(locId),
            this.nodeApi.adapters.toH256(itemId),
            this.nodeApi.adapters.toH256(Hash.of(itemDescription)),
            chainItemFiles.map(file => this.nodeApi.adapters.toCollectionItemFile(file)),
            this.nodeApi.adapters.toCollectionItemToken(itemToken ? {
                id: Hash.of(itemToken.id),
                type: Hash.of(itemToken.type),
                issuance: itemToken.issuance,
            } : undefined),
            booleanRestrictedDelivery,
            termsAndConditions.map(element => this.nodeApi.adapters.toTermsAndConditionsElement({
                tcType: Hash.of(element.type),
                tcLocId: element.tcLocId,
                details: Hash.of(element.details),
            })),
        );
        try {
            await signer.signAndSend({
                signerId: this.currentAddress.address,
                submittable,
                callback
            });
        } catch(e) {
            await this.cancelItemPublicDataSubmission(locId, itemId);
            throw e;
        }

        if(itemFiles) {
            for(const file of itemFiles) {
                if(file.hashOrContent.hasContent) {
                    await this.uploadItemFile({ locId, itemId, file });
                }
            }
        }
    }

    private async submitItemPublicData(locId: UUID, item: CreateOffchainCollectionItem) {
        try {
            await this.backend().post(
                `/api/collection/${ locId.toString() }/items`,
                item
            );
        } catch(e) {
            throw newBackendError(e);
        }
    }

    private async cancelItemPublicDataSubmission(locId: UUID, itemId: Hash) {
        try {
            await this.backend().delete(`/api/collection/${ locId.toString() }/items/${ itemId.toHex() }`);
        } catch(e) {
            throw newBackendError(e);
        }
    }

    async uploadItemFile(parameters: { locId: UUID, itemId: Hash, file: ItemFileWithContent }) {
        const { locId, itemId, file } = parameters;

        await file.hashOrContent.finalize(); // Ensure validity

        const formData = this.componentFactory.buildFormData();
        formData.append('file', await file.hashOrContent.data(), file.name);
        formData.append('hash', file.hashOrContent.contentHash.toHex());
        try {
            await this.backend().post(
                `/api/collection/${ locId.toString() }/${ itemId.toHex() }/files`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
        } catch(e) {
            throw newBackendError(e);
        }
    }

    private validTokenOrThrow(itemToken: ItemTokenWithRestrictedType) {
        const result = validateToken(this.nodeApi, itemToken);
        if(!result.valid) {
            if(result.error) {
                throw new Error("Given token definition is invalid");
            } else {
                throw new Error(`Given token definition is invalid: ${result.error}`);
            }
        }
        if(itemToken.issuance < 1n) {
            throw new Error("Token must have an issuance >= 1");
        }
    }

    override async getDeliveries(parameters: GetDeliveriesRequest): Promise<ItemDeliveries> {
        try {
            const { locId, itemId } = parameters;
            const response = await this.backend().get(`/api/collection/${ locId }/${ itemId.toHex() }/all-deliveries`);
            return response.data;
        } catch(e) {
            throw newBackendError(e);
        }
    }

    override async checkDelivery(parameters: CheckCollectionDeliveryRequest): Promise<CollectionDelivery> {
        try {
            const { locId, hash } = parameters;
            const response = await this.backend().put(`/api/collection/${ locId }/file-deliveries`, { copyHash: hash.toHex() });
            return response.data;
        } catch(e) {
            throw newBackendError(e);
        }
    }

    async submit(locId: UUID) {
        try {
            await this.backend().post(`/api/loc-request/${ locId }/submit`);
        } catch(e) {
            throw newBackendError(e);
        }
    }

    async cancel(locId: UUID) {
        try {
            await this.backend().post(`/api/loc-request/${ locId }/cancel`);
        } catch(e) {
            throw newBackendError(e);
        }
    }

    async rework(locId: UUID) {
        try {
            await this.backend().post(`/api/loc-request/${ locId }/rework`);
        } catch(e) {
            throw newBackendError(e);
        }
    }

    async getLocIssuers(
        request: LocRequest,
        locBatch: LocBatch,
    ): Promise<LocVerifiedIssuers> {
        if(!this.currentAddress || (request.status !== "OPEN" && request.status !== "CLOSED")) {
            return EMPTY_LOC_ISSUERS;
        } else {
            const locId = new UUID(request.id);
            let verifiedIssuer = false;
            if(request.locType === "Identity" && request.status === "CLOSED") {
                const availableVerifiedIssuers = await locBatch.getAvailableVerifiedIssuers();
                verifiedIssuer = availableVerifiedIssuers[request.ownerAddress].find(issuer => issuer.address === request.requesterAddress?.address && request.requesterAddress?.type === "Polkadot") !== undefined;
            }
            const nodeIssuers = (await locBatch.getLocsVerifiedIssuers())[locId.toDecimalString()];
            const chainSelectedIssuers = new Set<string>();
            nodeIssuers.forEach(issuer => chainSelectedIssuers.add(issuer.address));

            const issuers: VerifiedIssuer[] = [];
            if((this.currentAddress.address === request.requesterAddress?.address && this.currentAddress.type === request.requesterAddress.type)
                || (this.currentAddress.address === request.ownerAddress && this.currentAddress.type === "Polkadot")
                || chainSelectedIssuers.has(this.currentAddress.address)) {

                const backendIssuers = request.selectedIssuers;
                const addedIssuers = new Set<string>();
                for(const maybeSelectedIssuer of backendIssuers) {
                    addedIssuers.add(maybeSelectedIssuer.address);
                    issuers.push({
                        identityLocId: maybeSelectedIssuer.identityLocId.toString(),
                        address: maybeSelectedIssuer.address,
                        firstName: maybeSelectedIssuer?.identity.firstName || "",
                        lastName: maybeSelectedIssuer?.identity.lastName || "",
                        selected: chainSelectedIssuers.has(maybeSelectedIssuer.address), // Backend may be out-of-date
                    });
                }
                for(const nodeIssuer of nodeIssuers) {
                    if(!addedIssuers.has(nodeIssuer.address)) { // Backend may be out-of-date
                        issuers.push({
                            identityLocId: nodeIssuer.identityLocId.toString(),
                            address: nodeIssuer.address,
                            firstName: "",
                            lastName: "",
                            selected: true,
                        });
                    }
                }
            } else {
                for(const nodeIssuer of nodeIssuers) {
                    issuers.push({
                        identityLocId: nodeIssuer.identityLocId.toString(),
                        address: nodeIssuer.address,
                        firstName: "",
                        lastName: "",
                    });
                }
            }
            return {
                verifiedIssuer,
                issuers,
            };
        }
    }

    async canAddRecord(request: LocRequest): Promise<boolean> {
        return (this.currentAddress.address === request.requesterAddress?.address && this.currentAddress.type === request.requesterAddress?.type)
            || this.currentAddress.address === request.ownerAddress
            || await this.isIssuerOf(request);
    }

    private async isIssuerOf(request: LocRequest): Promise<boolean> {
        const issuers = await this.getLocIssuers(request, this.nodeApi.batch.locs([ new UUID(request.id) ]));
        return issuers.issuers.find(issuer => issuer.address === this.currentAddress.address && this.currentAddress.type === "Polkadot") !== undefined;
    }

    async addTokensRecord(parameters: AddTokensRecordParams & FetchParameters): Promise<void> {
        const {
            recordId,
            description,
            signer,
            callback,
            locId,
            files,
        } = parameters;

        const chainItemFiles: TypesTokensRecordFile[] = [];
        for(const itemFile of files) {
            await itemFile.finalize(); // Ensure hash and size
        }
        for(const itemFile of files) {
            chainItemFiles.push({
                name: Hash.of(itemFile.name),
                contentType: Hash.of(itemFile.contentType.mimeType),
                hash: itemFile.hashOrContent.contentHash,
                size: itemFile.size.toString(),
            });
        }

        await this.submitRecordPublicData(locId, {
            recordId: recordId.toHex(),
            files: files?.map(file => ({
                name: file.name,
                contentType: file.contentType.mimeType,
                hash: file.hashOrContent.contentHash.toHex(),
            })) || [],
            description,
        });

        const submittable = this.nodeApi.polkadot.tx.logionLoc.addTokensRecord(
            this.nodeApi.adapters.toLocId(locId),
            this.nodeApi.adapters.toH256(recordId),
            this.nodeApi.adapters.toH256(Hash.of(description)),
            this.nodeApi.adapters.newTokensRecordFileVec(chainItemFiles),
        );
        try {
            await signer.signAndSend({
                signerId: this.currentAddress.address,
                submittable,
                callback
            });
        } catch(e) {
            await this.cancelRecordPublicDataSubmission(locId, recordId);
            throw e;
        }

        for(const file of files) {
            if(file.hashOrContent.hasContent) {
                await this.uploadTokensRecordFile({ locId, recordId, file });
            }
        }
    }

    private async submitRecordPublicData(locId: UUID, record: CreateOffchainTokensRecord) {
        try {
            await this.backend().post(
                `/api/records/${ locId.toString() }/record`,
                record
            );
        } catch(e) {
            throw newBackendError(e);
        }
    }

    private async cancelRecordPublicDataSubmission(locId: UUID, recordId: Hash) {
        try {
            await this.backend().delete(`/api/records/${ locId.toString() }/record/${ recordId.toHex() }`);
        } catch(e) {
            throw newBackendError(e);
        }
    }

    async uploadTokensRecordFile(parameters: { locId: UUID, recordId: Hash, file: ItemFileWithContent }) {
        const { locId, recordId, file } = parameters;

        await file.hashOrContent.finalize(); // Ensure validity

        const formData = this.componentFactory.buildFormData();
        formData.append('file', await file.hashOrContent.data(), file.name);
        formData.append('hash', file.hashOrContent.contentHash.toHex());
        try {
            await this.backend().post(
                `/api/records/${ locId.toString() }/${ recordId.toHex() }/files`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
        } catch(e) {
            throw newBackendError(e);
        }
    }

    override async getTokensRecordDeliveries(parameters: GetTokensRecordDeliveriesRequest): Promise<ItemDeliveries> {
        return getTokensRecordDeliveries(this.backend(), parameters);
    }

    override async checkTokensRecordDelivery(parameters: CheckTokensRecordDeliveryRequest): Promise<CollectionDelivery> {
        return checkTokensRecordDelivery(this.backend(), parameters);
    }

    async requestFileReview(parameters: { locId: UUID, hash: Hash }): Promise<void> {
        const { locId, hash } = parameters;
        try {
            await this.backend().post(`/api/loc-request/${ locId.toString() }/files/${ hash.toHex() }/review-request`);
        } catch(e) {
            throw newBackendError(e);
        }
    }

    async reviewFile(parameters: { locId: UUID } & ReviewFileParams): Promise<void> {
        try {
            const { locId, hash, decision, rejectReason } = parameters;

            await this.backend().post(`/api/loc-request/${ locId.toString() }/files/${ hash.toHex() }/review`, { decision, rejectReason });
        } catch(e) {
            throw newBackendError(e);
        }
    }

    async publishFile(parameters: PublishFileParams): Promise<void> {
        const submittable = this.nodeApi.polkadot.tx.logionLoc.addFile(
            this.nodeApi.adapters.toLocId(parameters.locId),
            this.nodeApi.adapters.toPalletLogionLocFile(parameters.file),
        );

        await parameters.signer.signAndSend({
            signerId: this.currentAddress.address,
            submittable,
            callback: parameters.callback,
        });

        try {
            await this.backend().put(`/api/loc-request/${ parameters.locId.toString() }/files/${ parameters.file.hash.toHex() }/confirm`);
        } catch(e) {
            throw newBackendError(e);
        }
    }

    async acknowledgeFile(parameters: { locId: UUID } & AckFileParams): Promise<void> {
        const submittable = this.nodeApi.polkadot.tx.logionLoc.acknowledgeFile(
            this.nodeApi.adapters.toLocId(parameters.locId),
            this.nodeApi.adapters.toH256(parameters.hash),
        );

        await parameters.signer.signAndSend({
            signerId: this.currentAddress.address,
            submittable,
            callback: parameters.callback,
        });

        try {
            await this.backend().put(`/api/loc-request/${ parameters.locId.toString() }/files/${ parameters.hash.toHex() }/confirm-acknowledged`);
        } catch(e) {
            throw newBackendError(e);
        }
    }

    async requestMetadataReview(parameters: { locId: UUID, nameHash: Hash }): Promise<void> {
        const { locId, nameHash } = parameters;
        try {
            await this.backend().post(`/api/loc-request/${ locId.toString() }/metadata/${ nameHash.toHex() }/review-request`);
        } catch(e) {
            throw newBackendError(e);
        }
    }

    async reviewMetadata(parameters: { locId: UUID } & ReviewMetadataParams): Promise<void> {
        try {
            const { locId, nameHash, decision, rejectReason } = parameters;

            await this.backend().post(`/api/loc-request/${ locId.toString() }/metadata/${ nameHash.toHex() }/review`, { decision, rejectReason });
        } catch(e) {
            throw newBackendError(e);
        }
    }

    async publishMetadata(parameters: PublishMetadataParams): Promise<void> {
        const { name, value, submitter} = parameters.metadata;
        const nameHash = Hash.of(name);
        const submittable = this.nodeApi.polkadot.tx.logionLoc.addMetadata(
            this.nodeApi.adapters.toLocId(parameters.locId),
            this.nodeApi.adapters.toPalletLogionLocMetadataItem({
                name: nameHash,
                value: Hash.of(value),
                submitter,
            }),
        );

        await parameters.signer.signAndSend({
            signerId: this.currentAddress.address,
            submittable,
            callback: parameters.callback,
        });
    
        try {
            await this.backend().put(`/api/loc-request/${ parameters.locId.toString() }/metadata/${ nameHash.toHex() }/confirm`);
        } catch(e) {
            throw newBackendError(e);
        }
    }

    async acknowledgeMetadata(parameters: { locId: UUID } & AckMetadataParams): Promise<void> {
        const { locId, nameHash } = parameters;
        const submittable = this.nodeApi.polkadot.tx.logionLoc.acknowledgeMetadata(
            this.nodeApi.adapters.toLocId(parameters.locId),
            this.nodeApi.adapters.toH256(parameters.nameHash),
        );

        await parameters.signer.signAndSend({
            signerId: this.currentAddress.address,
            submittable,
            callback: parameters.callback,
        });

        try {
            await this.backend().put(`/api/loc-request/${ locId.toString() }/metadata/${ nameHash.toHex() }/confirm-acknowledged`);
        } catch(e) {
            throw newBackendError(e);
        }
    }

    async publishLink(parameters: PublishLinkParams): Promise<void> {
        const submittable = this.nodeApi.polkadot.tx.logionLoc.addLink(
            this.nodeApi.adapters.toLocId(parameters.locId),
            this.nodeApi.adapters.toPalletLogionLocLocLink(parameters.link),
        );

        await parameters.signer.signAndSend({
            signerId: this.currentAddress.address,
            submittable,
            callback: parameters.callback,
        });

        try {
            await this.backend().put(`/api/loc-request/${ parameters.locId.toString() }/links/${ parameters.link.id.toString() }/confirm`);
        } catch(e) {
            throw newBackendError(e);
        }
    }

    async rejectLoc(args: {
        locId: UUID,
        reason: string,
    }): Promise<void> {
        const axios = this.backend();
        try {
            await axios.post(`/api/loc-request/${ args.locId.toString() }/reject`, { rejectReason: args.reason });
        } catch(e) {
            throw newBackendError(e);
        }
    }

    async acceptTransactionLoc(parameters: { locId: UUID, requesterAccount?: SupportedAccountId, requesterLoc?: UUID } & Partial<BlockchainSubmissionParams>): Promise<void> {
        const { locId, requesterAccount, requesterLoc, callback } = parameters;
        if(requesterAccount) {
            await this.acceptLoc({ locId })
        } else if(requesterLoc) {
            const signer = requireDefined(parameters.signer);
            const submittable = this.nodeApi.polkadot.tx.logionLoc.createLogionTransactionLoc(
                this.nodeApi.adapters.toLocId(locId),
                this.nodeApi.adapters.toNonCompactLocId(requesterLoc),
            );
            await signer.signAndSend({
                signerId: this.currentAddress.address,
                submittable,
                callback,
            });
            await this.acceptLoc({ locId })
        } else {
            throw new Error("No requester provided");
        }
    }

    async openTransactionLoc(parameters: { locId: UUID, legalOfficer: LegalOfficer } & BlockchainSubmissionParams ) {
        const { locId, legalOfficer, signer, callback } = parameters
        const submittable = this.nodeApi.polkadot.tx.logionLoc.createPolkadotTransactionLoc(
            this.nodeApi.adapters.toLocId(locId),
            legalOfficer.address,
        );
        await signer.signAndSend({
            signerId: this.currentAddress.address,
            submittable,
            callback,
        });
        await this.openLoc({ locId });
    }

    async openLogionTransactionLoc(parameters: { locId: UUID, requesterLocId: UUID } & BlockchainSubmissionParams ) {
        const { locId, requesterLocId, signer, callback } = parameters;
        const submittable = this.nodeApi.polkadot.tx.logionLoc.createLogionTransactionLoc(
            this.nodeApi.adapters.toLocId(locId),
            this.nodeApi.adapters.toNonCompactLocId(requesterLocId),
        );
        await signer.signAndSend({
            signerId: this.currentAddress.address,
            submittable,
            callback,
        });
    }

    private async acceptLoc(args: { locId: UUID }) {
        const axios = this.backend();
        try {
            await axios.post(`/api/loc-request/${ args.locId.toString() }/accept`);
        } catch(e) {
            throw newBackendError(e);
        }
    }

    private async openLoc(args: { locId: UUID }) {
        const axios = this.backend();
        try {
            await axios.post(`/api/loc-request/${ args.locId.toString() }/open`);
        } catch(e) {
            throw newBackendError(e);
        }
    }

    async acceptIdentityLoc(parameters: { locId: UUID, requesterAccount?: SupportedAccountId, sponsorshipId?: UUID } & Partial<BlockchainSubmissionParams>): Promise<void> {
        const { locId, requesterAccount, sponsorshipId, callback } = parameters;
        if(requesterAccount) {
            if(requesterAccount.type === "Polkadot") {
                await this.acceptLoc({ locId });
            } else {
                if(!sponsorshipId) {
                    throw new Error("Other Identity LOCs can only be created with a sponsorship");
                }
                const signer = requireDefined(parameters.signer);
                const otherAccountId = this.nodeApi.queries.getValidAccountId(requesterAccount.address, requesterAccount.type).toOtherAccountId();
                const submittable = this.nodeApi.polkadot.tx.logionLoc.createOtherIdentityLoc(
                    this.nodeApi.adapters.toLocId(locId),
                    this.nodeApi.adapters.toPalletLogionLocOtherAccountId(otherAccountId),
                    this.nodeApi.adapters.toSponsorshipId(sponsorshipId),
                );
                await signer.signAndSend({
                    signerId: this.currentAddress.address,
                    submittable,
                    callback,
                });
                await this.acceptLoc({ locId });
            }
        } else {
            const submittable = this.nodeApi.polkadot.tx.logionLoc.createLogionIdentityLoc(
                this.nodeApi.adapters.toLocId(locId),
            );
            const signer = requireDefined(parameters.signer);
            await signer.signAndSend({
                signerId: this.currentAddress.address,
                submittable,
                callback,
            });
            await this.acceptLoc({ locId });
        }
    }

    async openIdentityLoc(parameters: { locId: UUID, legalOfficer: LegalOfficer } & BlockchainSubmissionParams ) {
        const { locId, legalOfficer, signer, callback } = parameters
        const submittable = this.nodeApi.polkadot.tx.logionLoc.createPolkadotIdentityLoc(
            this.nodeApi.adapters.toLocId(locId),
            legalOfficer.address,
        );
        await signer.signAndSend({
            signerId: this.currentAddress.address,
            submittable,
            callback,
        });
        await this.openLoc({ locId });
    }

    async openLogionIdentityLoc(parameters: { locId: UUID } & BlockchainSubmissionParams ) {
        const { locId, signer, callback } = parameters
        const submittable = this.nodeApi.polkadot.tx.logionLoc.createLogionIdentityLoc(
            this.nodeApi.adapters.toLocId(locId),
        );
        await signer.signAndSend({
            signerId: this.currentAddress.address,
            submittable,
            callback,
        });
    }

    async acceptCollectionLoc(parameters: { locId: UUID }): Promise<void> {
        await this.acceptLoc(parameters);
    }

    async openCollectionLoc(parameters: { locId: UUID, legalOfficer: LegalOfficer } & OpenCollectionLocParams) {
        const { locId, legalOfficer, signer, callback } = parameters
        const submittable = this.nodeApi.polkadot.tx.logionLoc.createCollectionLoc(
            this.nodeApi.adapters.toLocId(locId),
            legalOfficer.address,
            parameters.collectionLastBlockSubmission || null,
            parameters.collectionMaxSize || null,
            parameters.collectionCanUpload,
        );
        await signer.signAndSend({
            signerId: this.currentAddress.address,
            submittable,
            callback,
        });
        await this.openLoc({ locId });
    }

    async close(parameters: { locId: UUID, seal?: string } & BlockchainSubmissionParams): Promise<void> {
        let submittable: SubmittableExtrinsic;
        if(parameters.seal) {
            submittable = this.nodeApi.polkadot.tx.logionLoc.closeAndSeal(
                this.nodeApi.adapters.toLocId(parameters.locId),
                parameters.seal,
            );
        } else {
            submittable = this.nodeApi.polkadot.tx.logionLoc.close(
                this.nodeApi.adapters.toLocId(parameters.locId),
            );
        }

        await parameters.signer.signAndSend({
            signerId: this.currentAddress.address,
            submittable,
            callback: parameters.callback,
        });

        try {
            await this.backend().post(`/api/loc-request/${ parameters.locId.toString() }/close`);
        } catch(e) {
            throw newBackendError(e);
        }
    }

    async voidLoc(parameters: { locId: UUID } & VoidParams): Promise<void> {
        const { locId, replacer, reason, signer, callback } = parameters;

        let submittable;
        if(replacer) {
            submittable = this.nodeApi.polkadot.tx.logionLoc.makeVoidAndReplace(
                this.nodeApi.adapters.toLocId(locId),
                this.nodeApi.adapters.toLocId(replacer),
            );
        } else {
            submittable = this.nodeApi.polkadot.tx.logionLoc.makeVoid(
                this.nodeApi.adapters.toLocId(locId),
            );
        }
        await signer.signAndSend({
            signerId: this.currentAddress.address,
            submittable,
            callback
        });

        try {
            await this.backend().post(`/api/loc-request/${ locId.toString() }/void`, {
                reason
            });
        } catch(e) {
            throw newBackendError(e);
        }
    }

    async nominateIssuer(parameters: { locId: UUID, requester: string } & BlockchainSubmissionParams) {
        const submittable = this.nodeApi.polkadot.tx.logionLoc.nominateIssuer(
            parameters.requester,
            this.nodeApi.adapters.toLocId(parameters.locId),
        );
        await parameters.signer.signAndSend({
            signerId: this.currentAddress.address,
            submittable,
            callback: parameters.callback,
        });
    }

    async dismissIssuer(parameters: { requester: string } & BlockchainSubmissionParams) {
        const submittable = this.nodeApi.polkadot.tx.logionLoc.dismissIssuer(
            parameters.requester,
        );
        await parameters.signer.signAndSend({
            signerId: this.currentAddress.address,
            submittable,
            callback: parameters.callback,
        });
    }

    async getLegalOfficerVerifiedIssuers(): Promise<VerifiedIssuerIdentity[]> {
        try {
            const response = await this.backend().get("/api/issuers-identity");
            return response.data.issuers;
        } catch(e) {
            throw newBackendError(e);
        }
    }

    async setIssuerSelection(params: SetIssuerSelectionParams) {
        const submittable = this.nodeApi.polkadot.tx.logionLoc.setIssuerSelection(
            this.nodeApi.adapters.toLocId(params.locId),
            params.issuer,
            params.selected,
        );
        await params.signer.signAndSend({
            signerId: this.currentAddress.address,
            submittable,
            callback: params.callback,
        });
    }

    async requestVote(params: { locId: UUID } & BlockchainSubmissionParams): Promise<string> {
        const submittable = this.nodeApi.polkadot.tx.vote.createVoteForAllLegalOfficers(
            this.nodeApi.adapters.toLocId(params.locId),
        );
        const result = await params.signer.signAndSend({
            signerId: this.currentAddress.address,
            submittable,
            callback: params.callback,
        });
        const voteCreated = result.events.find(event => event.name === "VoteCreated" && event.section === "vote");
        if(!voteCreated) {
            throw new Error("Unable to retrieve vote ID");
        }
        const voteCreatedData = voteCreated.data as AnyJson[];
        return Adapters.asString(voteCreatedData[0]);
    }

    async setCollectionFileRestrictedDelivery(params: {
        locId: UUID,
        hash: Hash,
        restrictedDelivery: boolean,
    }): Promise<void> {
        const { locId, hash, restrictedDelivery } = params;
        try {
            await this.backend().put(`/api/collection/${ locId.toString() }/files/${ hash.toHex() }`, {
                restrictedDelivery
            });
        } catch(e) {
            throw newBackendError(e);
        }
    }
}

export interface ReviewFileParams {
    hash: Hash;
    decision: ReviewResult;
    rejectReason?: string;
}

export type ReviewResult = "ACCEPT" | "REJECT";

export interface PublishFileParams extends BlockchainSubmissionParams {
    locId: UUID;
    file: FileParams;
}

export interface AckFileParams extends BlockchainSubmissionParams {
    hash: Hash;
}

export interface ReviewMetadataParams {
    nameHash: Hash;
    decision: ReviewResult;
    rejectReason?: string;
}

export interface PublishMetadataParams extends BlockchainSubmissionParams {
    locId: UUID;
    metadata: {
        name: string;
        value: string;
        submitter: ValidAccountId;
    };
}

export interface AckMetadataParams extends BlockchainSubmissionParams {
    nameHash: Hash;
}

export interface OpenCollectionLocParams extends BlockchainSubmissionParams {
    collectionLastBlockSubmission?: bigint;
    collectionMaxSize?: number;
    collectionCanUpload: boolean;
}

export const EMPTY_LOC_ISSUERS: LocVerifiedIssuers = {
    verifiedIssuer: false,
    issuers: [],
}

export interface PublishLinkParams extends BlockchainSubmissionParams {
    locId: UUID;
    link: Link;
}

export interface VoidParams extends BlockchainSubmissionParams, VoidInfo {
    reason: string;
}

export interface SetIssuerSelectionParams extends BlockchainSubmissionParams {
    locId: UUID;
    issuer: string;
    selected: boolean;
}
