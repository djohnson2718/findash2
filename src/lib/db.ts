import Dexie from "dexie";
import type { Table } from "dexie";

export const Category = {
  Cash: { id: "cash", name: "Cash", sort: 1 },
  Taxable: { id: "tax", name: "Taxable", sort: 2 },
  Retirement: { id: "ret", name: "Retirement", sort: 3 },
  HSA: { id: "hsa", name: "HSA", sort: 4 },
  Education: { id: "edu", name: "Education", sort: 5 },
  Other: { id: "other", name: "Other", sort: 6 },
} as const;

export type CategoryId = (typeof Category)[keyof typeof Category]["id"];

export type CurrentBalance = {
  account: Account;
  amount: number;
  timestamp: number;
};

export interface Account {
  id: string;
  categoryId: CategoryId;
  name: string;
  sort: number;
  connectionId: string;
}

export interface Balance {
  id?: number;
  accountId: string;
  amount: number;
  timestamp: number;
}

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  timestamp: number;
  description: string;
  payee: string;
}

export interface Settings {
  key: string;
  value: string;
}

export interface Connection {
  id: String;
  name: String;
}

export class AppDB extends Dexie {
  accounts!: Table<Account, string>;
  balances!: Table<Balance, number>;
  transactions!: Table<Transaction, string>;
  settings!: Table<Settings, string>;
  connections!: Table<Connection, string>;

  constructor() {
    super("AppDB");

    this.version(9).stores({
      accounts: "id, category",
      balances: "++id, [accountId+timestamp]",
      transactions: "++id, [accountId+timestamp]",
      settings: "key",
      connections: "id",
    });
  }

  async clearAllData(): Promise<void> {
      await this.transaction("rw", this.accounts, this.balances, this.transactions, this.connections, async () => {
        await this.accounts.clear();
        await this.balances.clear();
        await this.transactions.clear();
        await this.connections.clear();
      });    
  }

  async addAccount(account: Account): Promise<string> {
    return await this.accounts.add(account);
  }

  async getTransactions(
    accountId: string,
    limit: number,
  ): Promise<Transaction[]> {
    return await this.transactions
      .where("[accountId+timestamp]")
      .between([accountId, Dexie.minKey], [accountId, Dexie.maxKey])
      .reverse()
      .limit(limit)
      .toArray();
  }

  async addBalanceIfMissing(balance: Balance): Promise<number> {
    const existingBalance = await this.balances
      .where("[accountId+timestamp]")
      .equals([balance.accountId, balance.timestamp])
      .first();
    if (existingBalance) {
      // Balance already exists, skip update
      return new Promise<number>((resolve) => resolve(existingBalance.id!));
    }
    return await this.balances.add(balance);
  }

  async putTransaction(transaction: Transaction): Promise<string> {
    return await this.transactions.put(transaction);
  }

  async getSetting(key: string): Promise<string | undefined> {
    const setting = await this.settings.get(key);
    return setting ? setting.value : undefined;
  }

  async putSetting(key: string, value: string): Promise<void> {
    await this.settings.put({ key, value });
  }

  async getCurrentBalances(): Promise<CurrentBalance[]> {
    const accounts = await this.accounts.toArray();

    const currentBalances = await Promise.all(
      accounts.map(async (account) => {
        const latestBalance = await this.balances
          .where("[accountId+timestamp]")
          .between([account.id, Dexie.minKey], [account.id, Dexie.maxKey])
          .last();

        return {
          account: account,
          amount: latestBalance ? latestBalance.amount : 0,
          timestamp: latestBalance ? latestBalance.timestamp : 0,
        };
      }),
    );
    return currentBalances;
  }

  async updateAccountCategory(
    accountId: string,
    newCategory: CategoryId,
  ): Promise<void> {
    await this.accounts.update(accountId, { categoryId: newCategory });
  }
}
export const db = new AppDB();
