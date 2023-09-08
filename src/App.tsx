import { useEffect, useState } from "react";
import { IAccount, IProvider, providers } from "@massalabs/wallet-provider";
import pollAsyncEvents from "./pollAsyncEvent";
import {
  Args,
  toMAS,
  Client,
  IClient,
  ClientFactory,
  DefaultProviderUrls,
  WalletClient,
  fromMAS,
} from "@massalabs/massa-web3";

const CONTRACT_ADDRESS = "AS1MAtScFwncd19rktPEqHQ8D3ZicoDGKm7nXyt1AaJFfzAx3Lbg";

const getWallet = async (walletName: string) => {
  const wallets = await providers();
  const _wallet = wallets.find((wallet) => {
    if (wallet.name() === walletName) {
      return wallet;
    }
  });

  return _wallet;
};

export default function Home() {
  const [wallet, setWallet] = useState<IProvider | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<IAccount | null>(null);
  const [finalBalance, setFinalBalance] = useState<string | null>(null);

  useEffect(() => {
    init("MASSASTATION");
  }, []);

  const initAccount = async (wallet: IProvider) => {
    const accounts: IAccount[] = await wallet.accounts();
    if (!accounts.length) {
    }
    return accounts;
  };

  const initClientWallet = async (wallet: IProvider, account: IAccount) => {
    return await ClientFactory.fromWalletProvider(wallet, account);
  };

  const init = async (chosenWallet: string) => {
    const wallet = await getWallet(chosenWallet);

    if (!wallet) return;
    setWallet(wallet);

    const accounts: IAccount[] = await initAccount(wallet);

    if (!accounts.length) return;

    const account = accounts[0];

    setSelectedAccount(account);

    const client = await initClientWallet(wallet, account);
    setClient(client);
  };

  const getBalance = async (client: IClient, accountAddress: string) => {
    if (!client) return;

    const balance = await client.wallet().getAccountBalance(accountAddress);

    setFinalBalance(balance?.final.toString() || null);

    return balance?.final.toString();
  };

  useEffect(() => {
    const accountAddress = selectedAccount?.address();
    if (!accountAddress || !client) return;
    getBalance(client, accountAddress);
  }, [client, selectedAccount]);

  async function deposit(reserve: string, amount: number) {
    try {
      if (client) {
        await client
          .smartContracts()
          .callSmartContract({
            targetAddress: POOL_ADDRESS,
            functionName: "deposit",
            parameter: new Args()
              .addString(reserve)
              .addU256(BigInt(amount))
              .serialize(),
            maxGas: BigInt(4_200_000_000),
            coins: fromMAS(10),
            fee: BigInt(0),
          })
          .then((res) => {
            console.log("OpId: ", res);
            // return res;
            pollAsyncEvents(client, res);
          });
      }
    } catch (error) {
      console.error(error);
    }
  }
  const POOL_ADDRESS = "AS1UdPdsJ1hc46Wajdd3HsAhXpkLbw7iF6roHVq2cTF59bY37bHH";

  async function borrow(reserve: string, amount: number) {
    try {
      if (client) {
        await client
          .smartContracts()
          .callSmartContract({
            targetAddress: POOL_ADDRESS,
            functionName: "borrow",
            parameter: new Args()
              .addString(reserve)
              .addU256(BigInt(amount))
              .serialize(),
            maxGas: BigInt(4_200_000_000),
            coins: fromMAS(10),
            fee: BigInt(0),
          })
          .then((res) => {
            console.log("OpId: ", res);
            pollAsyncEvents(client, res);
          });
      }
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold">Wallet</h2>
        <p className="text-xl mt-4">
          {wallet ? wallet.name() : "No wallet found"}
        </p>
      </div>
      <div className="flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold">Account</h2>
        <p className="text-xl mt-4">
          {selectedAccount?.address() || "No account found"}
        </p>
      </div>
      <div className="flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold">Balance</h2>
        {finalBalance && (
          <p className="text-xl mt-4">{toMAS(finalBalance).toString()}</p>
        )}
      </div>
      <div className="flex items-center gap-5 justify-center border p-4 rounded-md">
        <BasicButton
          onClick={async () => {
            await init("MASSASTATION");
          }}
        >
          Connect Massa Station
        </BasicButton>
        <BasicButton
          onClick={async () => {
            await init("BEARBY");
          }}
        >
          Connect Bearby
        </BasicButton>

        <BasicButton
          onClick={async () => {
            await borrow("MAS", 100);
          }}
        >
          Borrow
        </BasicButton>
        <BasicButton
          onClick={async () => {
            await deposit("MAS", 100);
          }}
        >
          Deposit
        </BasicButton>
      </div>
    </main>
  );
}

const BasicButton = ({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    onClick={onClick}
  >
    {children}
  </button>
);
