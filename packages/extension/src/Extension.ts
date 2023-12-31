import { web3AccountsSubscribe, web3Enable, isWeb3Injected, web3Accounts } from '@polkadot/extension-dapp';
import initMetaMask from "@polkadot/extension-compat-metamask/bundle";
import { InjectedAccountWithMeta, InjectedExtension } from '@polkadot/extension-inject/types';

export function isExtensionAvailable(): boolean {
    return isWeb3Injected;
}

export type InjectedAccount = InjectedAccountWithMeta;

export type InjectedAccountsConsumer = (accounts: InjectedAccount[]) => void;

export type InjectedAccountsConsumerRegister = (consumer: InjectedAccountsConsumer) => void;

export async function enableExtensions(appName: string): Promise<InjectedAccountsConsumerRegister> {
    await web3Enable(appName);
    return consumer => web3AccountsSubscribe(consumer, { extensions: [ "polkadot-js" ] });
}

export const META_MASK_NAME = "Web3Source";

export async function enableMetaMask(appName: string): Promise<boolean> {
    const injectedExtensions: InjectedExtension[] = await web3Enable(appName, [ initMetaMask ]);
    return injectedExtensions.find(injectedExtension => injectedExtension.name === META_MASK_NAME) !== undefined
}

export async function allMetamaskAccounts(): Promise<InjectedAccount[]> {
    return await web3Accounts({ accountType: [ "ethereum" ] })
}
