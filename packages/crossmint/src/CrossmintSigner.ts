import { CrossmintEVMWalletAdapter } from "@crossmint/connect";
import { BaseSigner, SignAndSendFunction, TypedSignature } from "@logion/client";
import { ValidAccountId } from "@logion/node-api";

export class CrossmintSigner extends BaseSigner {

    constructor(crossmint: CrossmintEVMWalletAdapter) {
        super();
        if(!crossmint.connected) {
            throw new Error("Crossmint wallet is not connected");
        }
        this.crossmint = crossmint;
    }

    private crossmint: CrossmintEVMWalletAdapter;

    async signToHex(_signerId: ValidAccountId, message: string): Promise<TypedSignature> {
        const signature = await this.crossmint.signMessage(message);
        return { signature, type: "CROSSMINT_ETHEREUM" };
    }

    async buildSignAndSendFunction(): Promise<SignAndSendFunction> {
        throw new Error("Cannot sign and send extrinsics with Crossmint signer");
    }
}