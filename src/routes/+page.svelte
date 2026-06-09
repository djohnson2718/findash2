<script lang="ts">
  import { db, Category } from "$lib/db";
  import { onMount, tick } from "svelte";
  import type { Balance, CategoryId, CurrentBalance } from "$lib/db";
  import ApexCharts from "apexcharts";
  import type { ApexOptions } from "apexcharts";
  import CategoryDiv from "$lib/components/CategoryDiv.svelte";
  import { loadFromSimpleFin, clearSimpleFinData } from "$lib/simplefin";
  import AccountsTable from "$lib/components/AccountsTable.svelte";
  import Modal from "$lib/components/Modal.svelte";

  // Create account form state
  let selectedCategoryId: CategoryId = $state("other");
  let accountName: string = $state("");

  let currentBalances: CurrentBalance[] = $state([]);

  // Balance snapshot form state
  let accountId: string = $state("");
  let balance: number = $state(0);
  let date: string = $state("");

  let chartInstance: ApexCharts;
  let chartDiv: HTMLDivElement;
  const pieChartOptions: ApexOptions = {
    chart: { type: "pie", toolbar: { show: false } },
    labels: Object.values(Category).map((c) => c.name),
    colors: ["#2c7be5", "#20c997", "#f59e0b", "#9333ea", "#f59e0b", "#6b7280"],
    legend: { position: "bottom", horizontalAlign: "center" },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
    }, //,
    //tooltip: { y: { formatter: (value) => `$${value.toLocaleString()}` } }
  };

  let chartSeries = $derived(
    Object.values(Category).map((c) =>
      currentBalances
        .filter((b) => b.account.categoryId === c.id)
        .map((b) => b.amount)
        .reduce((a, b) => a + b, 0),
    ),
  );

  async function loadBalances() {
    currentBalances = await db.getCurrentBalances();
    console.log("loaded balances", $state.snapshot(currentBalances));
  }

  onMount(async () => {
    await loadBalances();
    chartInstance = new ApexCharts(chartDiv, {
      ...pieChartOptions,
      series: chartSeries,
    });
    chartInstance.render();
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

  function createBalanceSnapshot() {
    if (!accountId || !balance || !date) {
      alert("Please select an account, enter a balance, and select a date.");
      return;
    }

    const timestamp = new Date(date).getTime();
    const newBalance = {
      accountId,
      amount: balance,
      timestamp,
    };

    db.balances.add(newBalance);
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

<AccountsTable {currentBalances} />


<div id="chart" bind:this={chartDiv} style="width:50%;"></div>


<div>
  <button class="modern-button" onclick={loadFromSimpleFin}
    >Get Data from SimpleFin</button
  >
  <button class="modern-button" onclick={clearSimpleFinData}
    >Clear SimpleFin Credentials</button
  >
  <button class="modern-button" onclick={clearAllData}>Clear All Data</button>
</div>

<h2>Create a New Account</h2>
<div>
  <label for="category">Category:</label>
  <select id="category" bind:value={selectedCategoryId}>
    <option value="">-- Select a category --</option>
    {#each Object.values(Category) as category (category.id)}
      <option value={category.id}>{category.name}</option>
    {/each}
  </select>
</div>

<div>
  <label for="accountName">Account Name:</label>
  <input id="accountName" type="text" bind:value={accountName} />
</div>

<div>
  <button class="modern-button" onclick={createAccount}>Create Account</button>
</div>

<h2>Create a balance snapshot</h2>

<div>
  <label for="account">Account:</label>
  <select id="account" bind:value={accountId}>
    <option value="">-- Select an account --</option>
    {#each currentBalances as b (b.account.id)}
      <option value={b.account.id}>{b.account.name}</option>
    {/each}
  </select>
</div>

<div>
  <label for="balance">Balance:</label>
  <input id="balance" type="number" bind:value={balance} />
</div>

<div>
  <label for="date">Date:</label>
  <input id="date" type="date" bind:value={date} />
</div>

<div>
  <button class="modern-button" onclick={createBalanceSnapshot}
    >Create Balance Snapshot</button
  >
</div>
