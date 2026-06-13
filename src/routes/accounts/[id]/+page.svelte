<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import Modal from "$lib/components/Modal.svelte";
  import { Category } from "$lib/db";
  import type { Account, CategoryId, Connection, Transaction } from "$lib/db";
  import { db } from "$lib/db";

  const props: {
    data: {
      account: Account;
      transactions: Transaction[];
      connection: Connection;
      error: string | null;
    };
  } = $props();
  let selectedCategory: CategoryId = $state(Category.Other.id);
  let changeCatModal: Modal;
  let addTransModal: Modal;
  let addValModal: Modal;
  let renameModal: Modal;

  let newName: string = $state("");

  let newTransAmount: number = $state(0);
  let newTransDate: string = $state("");
  let newTransDescription: string = $state("");
  let newTransPayee: string = $state("");

  let newValAmount: number = $state(0);
  let newValDate: number = $state(0);

  function saveCategoryChange() {
    db.updateAccountCategory(props.data.account.id, selectedCategory)
      .then(async () => {
        alert(`Category changed successfully! ${selectedCategory}`);
        await invalidateAll();
      })
      .catch((err) => {
        console.error("Error changing category:", err);
        alert("Failed to change category. Please try again.");
      });
  }

  function rename() {
    db.updateAccountName(props.data.account.id, newName)
      .then(async () => {
        alert(`Account renamed! ${newName}`);
        await invalidateAll();
      })
      .catch((err) => {
        console.error("Error renaming account:", err);
        alert("Failed to rename account. Please try again.");
      });
  }

  async function manualTransaction() {
    await db.addManualTransaction({
      accountId: props.data.account.id,
      amount: newTransAmount,
      timestamp: new Date(newTransDate).getTime() / 1000,
      description: newTransDescription,
      payee: newTransPayee,
    });
    await invalidateAll();
  }

  async function manualBalance() {
    await db.addManualBalance({
      accountId: props.data.account.id,
      amount: newValAmount,
      timestamp: new Date(newValDate).getTime() / 1000,
    });
    await invalidateAll();
  }
</script>

<h1>
  Account details for {props.data.account.name} [{props.data.connection.name}]
</h1>

<div>
  <table class="custom-table">
    <thead>
      <tr>
        <th>Description</th>
        <th>Amount</th>
        <th>Date</th>
        <th>Timestamp</th>
      </tr>
    </thead>
    <tbody>
      {#each props.data.transactions as t}
        <tr>
          <td>{t.description}</td>
          <td>${t.amount.toLocaleString()}</td>
          <td>{new Date(t.timestamp).toLocaleString()}</td>
          <td>{t.timestamp}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<div class="menu-container">
  <details>
    <summary class="modern-button">Edit</summary>
    <nav class="fly-up-menu">
      <ul>
        <li>
          <button
            class="modern-button"
            onclick={() => changeCatModal.showModal()}>Change Category</button
          >
        </li>
        <li>
          <button class="modern-button" onclick={() => renameModal.showModal()}
            >Rename</button
          >
        </li>
        <li>
          <button
            class="modern-button"
            onclick={() => addTransModal.showModal()}
            >Add manual transaction</button
          >
        </li>
        <li>
          <button class="modern-button" onclick={() => addValModal.showModal()}
            >Add manual value snapshot</button
          >
        </li>
      </ul>
    </nav>
  </details>
</div>

<Modal bind:this={changeCatModal} onSave={saveCategoryChange}>
  <h2>Change Category</h2>
  <label for="category">Category:</label>
  <select id="category" bind:value={selectedCategory}>
    <option value="">-- Select a category --</option>
    {#each Object.values(Category) as category (category.id)}
      <option value={category.id}>{category.name}</option>
    {/each}
  </select>
</Modal>

<Modal bind:this={renameModal} onSave={rename}>
  <h2>Rename Account</h2>
  <input type="text" bind:value={newName} />
</Modal>

<Modal bind:this={addTransModal} onSave={manualTransaction}>
  <h2>Add Manual Transaction</h2>
  <label for="transAmount">Amount:</label>
  <input type="number" bind:value={newTransAmount} id="transAmount" />
  <label for="transDate">Date:</label>
  <input type="date" bind:value={newTransDate} id="transDate" />
  <label for="transDescription">Description:</label>
  <input type="text" bind:value={newTransDescription} id="transDescription" />
  <label for="transPayee">Payee:</label>
  <input type="text" bind:value={newTransPayee} id="transPayee" />
</Modal>

<Modal bind:this={addValModal} onSave={manualBalance}>
  <h2>Add Manual Value Snapshot</h2>
  <label for="valAmount">Amount:</label>
  <input type="number" bind:value={newValAmount} id="valAmount" />
  <label for="valDate">Date:</label>
  <input type="date" bind:value={newValDate} id="valDate" />
</Modal>
