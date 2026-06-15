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
  import LineChart from "$lib/components/LineChart.svelte";
  import type { ApexAxisChartSeries } from "apexcharts";

  // Create account form state
  let selectedCategoryId: CategoryId = $state("other");
  let accountName: string = $state("");

  //let currentBalances: CurrentBalance[] = $state([]);

  // Balance snapshot form state
  let accountId: string = $state("");
  let balance: number = $state(0);
  let date: string = $state("");

  let timeOptions = [
    { name: "1 Day", time: 1 },
    { name: "7 Days", time: 7 },
    { name: "30 Days", time: 30 },
    { name: "90 Days", time: 90 },
  ];

  let chartTimeOptions = [
    { name: "7 days", time: 7 },
    { name: "30 days", time: 30 },
    { name: "90 days", time: 90 },
    { name: "180 days", time: 180 },
    { name: "1 year", time: 365 },
  ];

  let createAccountModal: Modal;

  let lookBackTime: { name: string; time: number } = $state(timeOptions[0]);
  let chartLookBackTime: { name: string; time: number } = $state(
    chartTimeOptions[0],
  );

  let currentBalances: CurrentBalance[] = $state([]);
  let lineSeries: ApexAxisChartSeries = $state([]);

  async function loadBalances() {
    currentBalances = await db.getCurrentBalances(lookBackTime.time);
  }
  $effect(() => {
    loadBalances();
  });

  async function loadLineChartData() {
    lineSeries = await db.getCategorySeries(chartLookBackTime.time);
  }
  $effect(() => {
    loadLineChartData();
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

<SegmentedControl options={timeOptions} bind:selectedOption={lookBackTime} />
<AccountsTable {currentBalances} />

<div class="charts-container">
  <PieChart {currentBalances} width={"400px"} />
  <LineChart series={lineSeries} width={"400px"} />
</div>
<SegmentedControl
  options={chartTimeOptions}
  bind:selectedOption={chartLookBackTime}
></SegmentedControl>

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
