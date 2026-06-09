<script lang="ts">
    import Modal from '$lib/components/Modal.svelte';
    import { Category } from '$lib/db';
    import type { Account, CategoryId, Connection, Transaction } from '$lib/db';
    import {db} from '$lib/db';

  const props : { data :{account: Account; transactions: Transaction[]; connection: Connection; error: string | null;} } = $props();
  let selectedCategory : CategoryId = $state(Category.Other.id)
  let changeCatModal: Modal;
  let addTransModal: Modal; 
  let addValModal: Modal;

  function saveCategoryChange() {
    db.updateAccountCategory(props.data.account!.id, selectedCategory).then(() => {
      alert(`Category changed successfully! ${selectedCategory}`);;
    }).catch(err => {
      console.error('Error changing category:', err);
      alert('Failed to change category. Please try again.');
    });
  }
</script>

<h1>Account details for { props.data.account.name } [{props.data.connection.name}] </h1>

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
        <li><button class="modern-button" onclick={() => changeCatModal.showModal()}>Change Category</button></li>
        <li><button class="modern-button" onclick={() => addTransModal.showModal()}>Add manual transaction</button></li>
        <li><button class="modern-button" onclick={() => addValModal.showModal()}>Add manual value snapshot</button></li>
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
  </select>  </Modal>

<Modal bind:this={addTransModal} onSave={() => alert("Saved from modal!")}>
  <h2>Add Manual Transaction</h2>
  <p>This is the content of the modal.</p>  </Modal>

  <Modal bind:this={addValModal} onSave={() => alert("Saved from modal!")}>
  <h2>Add Manual Value Snapshot</h2>
  <p>This is the content of the modal.</p>  </Modal>

