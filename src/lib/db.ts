import { SECONDS_IN_DAY } from "$lib";
import type { ApexAxisChartSeries } from "apexcharts";
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
  change: number;
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

    this.version(12).stores({
      accounts: "id, category",
      balances: "++id, [accountId+timestamp], timestamp",
      transactions: "id, [accountId+timestamp]",
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

  async addManualBalance(balance: Balance) {
    let existingBalance;
    do {
      existingBalance = await this.balances
        .where("[accountId+timestamp]")
        .equals([balance.accountId, balance.timestamp])
        .first();
      if (existingBalance) {
        balance.timestamp += 1;
      }
    } while (existingBalance);
    return await this.balances.add(balance);
  }

  async putTransaction(transaction: Transaction): Promise<string> {
    return await this.transactions.put(transaction);
  }

  async addManualTransaction(transaction: Omit<Transaction, "id">): Promise<string> {
    const fullTransaction: Transaction = {
      id: crypto.randomUUID(),
      ...transaction,
    };
    return await this.transactions.add(fullTransaction);
  }

  async getSetting(key: string): Promise<string | undefined> {
    const setting = await this.settings.get(key);
    return setting ? setting.value : undefined;
  }

  async putSetting(key: string, value: string): Promise<void> {
    await this.settings.put({ key, value });
  }

  async getCurrentBalances(changeDays: number): Promise<CurrentBalance[]> {
    const accounts = await this.accounts.toArray();
    const nowSeconds = Date.now() / 1000;
    const changeSeconds = changeDays * SECONDS_IN_DAY;
    console.log(nowSeconds, changeSeconds, nowSeconds - changeSeconds);

    const currentBalances = await Promise.all(
      accounts.map(async (account) => {
        const latestBalance = await this.balances
          .where("[accountId+timestamp]")
          .between([account.id, Dexie.minKey], [account.id, Dexie.maxKey])
          .last();


        let prevBalance = await this.balances
          .where("[accountId+timestamp]")
          .between([account.id, Dexie.minKey], [account.id, nowSeconds - changeSeconds])
          .last();


        console.log(account.name);

        console.log("latest balance ", latestBalance, "prev balance", prevBalance);
        const change = latestBalance ?
          (latestBalance.amount - (prevBalance ? prevBalance.amount : 0)) :
          0;

        return {
          account: account,
          amount: latestBalance ? latestBalance.amount : 0,
          timestamp: latestBalance ? latestBalance.timestamp : 0,
          change: change
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

  async updateAccountName(
    accountId: string,
    newName: string,
  ): Promise<void> {
    await this.accounts.update(accountId, { name: newName });
  }

  async getCategorySeries(days: number): Promise<ApexAxisChartSeries> {
    const accounts = await this.accounts.toArray();
    const nowSeconds = Date.now() / 1000;
    const startSeconds = nowSeconds - (days * 24 * 60 * 60);

    const accountStartBalances: { account: Account, startBalance: number }[] = await Promise.all(
      accounts.map(async (account) => {

        let startBalance = await this.balances
          .where("[accountId+timestamp]")
          .between([account.id, Dexie.minKey], [account.id, startSeconds])
          .last();

        return { account: account, startBalance: startBalance ? startBalance.amount : 0 };

      }),
    );

    const recentBalances: Balance[] = await this.balances
      .where("timestamp")
      .between(startSeconds, nowSeconds)
      .toArray();

    recentBalances.sort((a, b) => a.timestamp - b.timestamp);

    let series = [] as ApexAxisChartSeries;
    for (const cat of Object.values(Category)) {
      let dataMap: Map<number, number> = new Map<number, number>();
      let acctToBalanceMap: Map<string, number> = new Map<string, number>();
      for (const startBal of accountStartBalances) {
        if (startBal.account.categoryId === cat.id) {
          acctToBalanceMap.set(startBal.account.id, startBal.startBalance);
        }
      }
      const totStartBalance = acctToBalanceMap.values().reduce((a, b) => a + b, 0);
      dataMap.set(startSeconds, totStartBalance);

      for (const bal of recentBalances) {
        if (acctToBalanceMap.has(bal.accountId)) {
          acctToBalanceMap.set(bal.accountId, bal.amount);
          const totBal = acctToBalanceMap.values().reduce((a, b) => a + b, 0);
          dataMap.set(bal.timestamp, totBal);
        }
      }

      const totEndBalance = acctToBalanceMap.values().reduce((a, b) => a + b, 0);
      dataMap.set(nowSeconds, totEndBalance);

      let catSeries: { name: string, data: { x: number, y: number }[] } = { name: cat.name, data: Array.from(dataMap.entries()).map(([x, y]) => ({ x, y })) };
      series.push(catSeries);
    }
    console.log("returned series", series);
    return series;
  }
}
export const db = new AppDB();
