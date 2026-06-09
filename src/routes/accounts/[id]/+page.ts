import {db, type Account, type Connection, type Transaction} from '$lib/db';
import { error } from '@sveltejs/kit';
export async function load({ params }) {
  const account = await db.accounts.get(params.id);
  if (!account) {
    throw error(400, "Unknown account id");
  }
  const transactions : Transaction[] = await db.getTransactions(params.id, 10);
  let connection = await db.connections.get(account.connectionId);
  if (!connection)
  {
    connection = {id:account.connectionId, name:"unknown" + account.connectionId};
  }

  return { account: account, transactions: transactions, connection : connection ? connection : null, error: null };
};