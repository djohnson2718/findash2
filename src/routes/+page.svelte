<script lang="ts">
  import { db, Category } from "$lib/db";
  import { onMount } from "svelte";
  import type { CategoryId, CurrentBalance } from "$lib/db";
  import { loadFromSimpleFin, clearSimpleFinData } from "$lib/simplefin";
  import AccountsTable from "$lib/components/AccountsTable.svelte";
  import PieChart from "$lib/components/PieChart.svelte";
  import Modal from "$lib/components/Modal.svelte";
  import SegmentedControl from "$lib/components/SegmentedControl.svelte";
  import { SECONDS_IN_DAY } from "$lib";

  // Create account form state
  let selectedCategoryId: CategoryId = $state("other");
  let accountName: string = $state("");

  //let currentBalances: CurrentBalance[] = $state([]);

  // Balance snapshot form state
  let accountId: string = $state("");
  let balance: number = $state(0);
  let date: string = $state("");

  let createAccountModal: Modal;

  let lookBackTime: { name: string; time: number } = $state({
    name: "1 Day",
    time: SECONDS_IN_DAY,
  });

  let currentBalances: CurrentBalance[] = $state([]);

  async function loadBalances() {
    currentBalances = await db.getCurrentBalances(lookBackTime.time);
    console.log("loaded balances", $state.snapshot(currentBalances));
  }

  $effect(() => {
    loadBalances();
  });

  function createAccount() {
    if (!selectedCategoryId || !accountName) {
      alert("Please select a category and enter an account name.");
      return;
    }
    const newAccount = {
      id: crypto.randomUUID(),
      name: accountName,
      categoryId: selectedCategoryId,
      sort: 0,
      connectionId: "manual",
    };

    db.accounts.add(newAccount);
    loadBalances();
  }

  function clearAllData() {
    if (
      confirm(
        "Are you sure you want to clear all data (not settings)? This action cannot be undone.",
      )
    ) {
      db.clearAllData();
      alert("All data cleared");
    }
  }
</script>

<p>
  Welcome to FinDash, your financial dashboard for tracking and managing your
  finances.
</p>

<SegmentedControl
  options={[
    { name: "1 Day", time: SECONDS_IN_DAY },
    { name: "7 Days", time: 7 * SECONDS_IN_DAY },
    { name: "30 Days", time: 30 * SECONDS_IN_DAY },
    { name: "90 Days", time: 90 * SECONDS_IN_DAY },
  ]}
  bind:selectedOption={lookBackTime}
/>
<AccountsTable {currentBalances} />

<PieChart {currentBalances} width={"400px"} />

<div>
  <button class="modern-button" onclick={loadFromSimpleFin}
    >Get Data from SimpleFin</button
  >
  <button class="modern-button" onclick={clearSimpleFinData}
    >Clear SimpleFin Credentials</button
  >
  <button class="modern-button" onclick={clearAllData}>Clear All Data</button>
  <button class="modern-button" onclick={() => createAccountModal.showModal()}
    >Create Account</button
  >
</div>

<Modal bind:this={createAccountModal} onSave={createAccount}>
  <h2>Create a New Account</h2>

  <label for="category">Category:</label>
  <select id="category" bind:value={selectedCategoryId}>
    <option value="">-- Select a category --</option>
    {#each Object.values(Category) as category (category.id)}
      <option value={category.id}>{category.name}</option>
    {/each}
  </select>
  <label for="accountName">Account Name:</label>
  <input id="accountName" type="text" bind:value={accountName} />
</Modal>
