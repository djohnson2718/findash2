import { invalidateAll } from "$app/navigation";
import { db, Category } from "./db";
const SIMPLE_FIN_API_URL_KEY = "simpleFinAccessUrl";
const SIMPLE_FIN_AUTH_KEY = "simpleFinAuth";

export async function loadFromSimpleFin() {
  let accessUrl = await db.getSetting(SIMPLE_FIN_API_URL_KEY);
  let auth = await db.getSetting(SIMPLE_FIN_AUTH_KEY);
  if (!accessUrl || !auth) {
    let newAccessUrl = await getSimpleFinAccessUrl();
    if (!newAccessUrl) {
      alert("SimpleFin access URL was not sucessfully fetched");
      return;
    } else {
      console.log("got new access url", newAccessUrl);
      db.putSetting(SIMPLE_FIN_API_URL_KEY, newAccessUrl.url);
      db.putSetting(SIMPLE_FIN_AUTH_KEY, newAccessUrl.auth);
    }
  } else {
    console.log("found existing access url", accessUrl);
    const atIndex = accessUrl.indexOf("@");
    const startTimestamp = 1778229312; //new Date().getTime() - (30 * 24 * 60 * 60 * 1000); // 90 days ago
    console.log("fetching accounts data from ", startTimestamp);
    const response = await fetch(
      accessUrl + "/accounts?version=2&start-date=" + startTimestamp,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
        },
      },
    );
    const accountsData = await response.json();
    console.log("got accounts data", accountsData);

    for (const retrivedConnection of accountsData["connections"]) {
      let conn = await db.connections.get(retrivedConnection.conn_id);
      if (!conn) {
        await db.connections.add({
          id: retrivedConnection.conn_id,
          name: retrivedConnection.name
        });
      }
    }

    for (const retrievedAccount of accountsData["accounts"]) {
      let account = await db.accounts.get(retrievedAccount.id);
      if (!account) {
        const newSort = (await db.accounts.count()) + 1;
        await db.accounts.add({
          id: retrievedAccount.id,
          name: retrievedAccount.name,
          categoryId: Category.Other.id,
          sort: newSort,
          connectionId: retrievedAccount.conn_id,
        });
      }

      db.addBalanceIfMissing({
        accountId: retrievedAccount["id"],
        amount: Number(retrievedAccount["available-balance"]),
        timestamp: Number(retrievedAccount["balance-date"]),
      });

      for (const retrievedTransaction of retrievedAccount["transactions"]) {
        await db.putTransaction({
          id: retrievedTransaction.id,
          accountId: retrievedAccount.id,
          amount: Number(retrievedTransaction.amount),
          timestamp: Number(retrievedTransaction.posted),
          description: retrievedTransaction.description,
          payee: retrievedTransaction.payee,
        });
      }
    }
  }
  // doesn't seem to work? invalidateAll();
}

async function getSimpleFinAccessUrl(): Promise<{
  url: string;
  auth: string;
} | null> {
  const setupToken = prompt("Please enter your SimpleFin API setup token:");
  if (!setupToken) {
    return null;
  }
  const claimUrl = atob(setupToken);

  const response = await fetch(claimUrl, {
    method: "POST",
    headers: {
      "Content-Length": "0",
    },
  });

  const fullAccessUrl = await response.text();
  const atIndex = fullAccessUrl.indexOf("@");
  if (atIndex !== -1) {
    const accessUrl = "https://" + fullAccessUrl.substring(atIndex + 1);
    const clientSecret = fullAccessUrl.substring(8, atIndex);
    const auth = btoa(`${clientSecret}:`);
    return { url: accessUrl, auth: auth };
  } else {
    alert("Invalid SimpleFin access URL format");
    return null;
  }
}

export async function clearSimpleFinData() {
  await db.putSetting(SIMPLE_FIN_API_URL_KEY, "");
  await db.putSetting(SIMPLE_FIN_AUTH_KEY, "");
  alert("SimpleFin data cleared");
}
