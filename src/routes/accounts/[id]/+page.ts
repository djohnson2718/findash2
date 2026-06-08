import {db, type Transaction} from '$lib/db';
export async function load({ params }) {
  console.log("LOADER PARAMS:", params);

  const account = await db.accounts.get(params.id);
  if (!account) {
    console.error(`Account with ID ${params.id} not found`);
    return { account: null, transactions: [], error: 'Account not found' };
  }
  const transactions : Transaction[] = await db.getTransactions(params.id, 10);

  return { account: account, transactions: transactions, error: null };
}