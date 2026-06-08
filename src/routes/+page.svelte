<script lang="ts">
  import { db, Category } from '$lib/db';
  import { onMount, tick } from 'svelte';
  import type { Balance, CategoryKey, CurrentBalance } from '$lib/db';
  import ApexCharts from 'apexcharts'; 
  import type { ApexOptions } from 'apexcharts';
  import CategoryDiv from '$lib/components/CategoryDiv.svelte';
  
  let SIMPLE_FIN_API_URL_KEY = 'simpleFinAccessUrl';
  let SIMPLE_FIN_AUTH_KEY = 'simpleFinAuth';
  // Create account form state
  let selectedCategory : CategoryKey = $state('other');
  let accountName : string = $state('');

  let currentBalances: CurrentBalance[] = $state([]);
  
  // Balance snapshot form state 
  let accountId : string = $state('');
  let balance : number = $state(0);
  let date : string = $state('');

  let chartInstance : ApexCharts;
  let chartDiv : HTMLDivElement;
  const pieChartOptions: ApexOptions = {
    chart: { type: 'pie', toolbar: { show: false } },
    labels: Object.values(Category).map(c => c.name),
    colors: ['#2c7be5', '#20c997', '#f59e0b', '#9333ea', '#f59e0b', '#6b7280'],
    legend: { position: 'bottom', horizontalAlign: 'center' },
    dataLabels: { enabled: true, formatter: (val : number ) => `${val.toFixed(1)}%` }//,
    //tooltip: { y: { formatter: (value) => `$${value.toLocaleString()}` } }
  };

  let chartSeries = $derived(Object.values(Category).map(c => 
    currentBalances.filter(b => b.account.category === c.id).map(b => b.amount).reduce((a, b) => a + b, 0)));

  async function loadBalances() {
    currentBalances = await db.getCurrentBalances();
    console.log("loaded balances", currentBalances);
  }

    onMount(async () => {
      await loadBalances();
      chartInstance = new ApexCharts(chartDiv, {
        ...pieChartOptions,
        series: chartSeries
      });
      chartInstance.render();
    });

  function createAccount() {
    if (!selectedCategory || !accountName) {
      alert('Please select a category and enter an account name.');
      return;
    }
    const newAccount = {
      id: crypto.randomUUID(),
      name: accountName,
      category: selectedCategory,
      sort: 0
    };

    db.accounts.add(newAccount);
    loadBalances();
  }

  function createBalanceSnapshot() {
    if (!accountId || !balance || !date) {
      alert('Please select an account, enter a balance, and select a date.');
      return;
    }

    const timestamp = new Date(date).getTime();
    const newBalance = {
      accountId,
      amount: balance,
      timestamp
    };

    db.balances.add(newBalance);
    loadBalances();
  }

  async function loadFromSimpleFin() {
    let accessUrl = await db.getSetting(SIMPLE_FIN_API_URL_KEY);
    let auth = await db.getSetting(SIMPLE_FIN_AUTH_KEY);
    if (!accessUrl || !auth) {
      let newAccessUrl = await getSimpleFinAccessUrl();
      if (!newAccessUrl) {
        alert('SimpleFin access URL was not sucessfully fetched');
        return;
      }
      else
      {
        console.log("got new access url", newAccessUrl);
        db.setSetting(SIMPLE_FIN_API_URL_KEY, newAccessUrl.url);
        db.setSetting(SIMPLE_FIN_AUTH_KEY, newAccessUrl.auth);
      }
    }
    else
    {
      console.log("found existing access url", accessUrl);
      const atIndex = accessUrl.indexOf('@');
      const startTimestamp = 	1778229312;//new Date().getTime() - (30 * 24 * 60 * 60 * 1000); // 90 days ago
      console.log("fetching accounts data from ", startTimestamp);
      const response = await fetch(accessUrl + '/accounts?version=2&start-date=' + startTimestamp, {
        method: "GET",
        headers: {
          "Authorization": `Basic ${auth}`
        }
      });
      const accountsData = await response.json();
      console.log("got accounts data", accountsData);

      for (const retrievedAccount of accountsData["accounts"])
      {
        let account = await db.accounts.get(retrievedAccount.id);
        if (!account)        {
          const newSort = (await db.accounts.count()) + 1;
          await db.accounts.add({
            id: retrievedAccount.id,
            name: retrievedAccount.name,
            category: Category.Other.id,
            sort: newSort
          }
          );
        }

        db.newBalance({
          accountId: retrievedAccount["id"],
          amount: Number(retrievedAccount["available-balance"]),
          timestamp: Number(retrievedAccount["balance-date"])
        });

        for (const retrievedTransaction of retrievedAccount["transactions"])
        {
            await db.putTransaction({
              id: retrievedTransaction.id,
              accountId: retrievedAccount.id,
              amount: Number(retrievedTransaction.amount),
              timestamp: Number(retrievedTransaction.posted),
              description: retrievedTransaction.description,
              payee: retrievedTransaction.payee
            });
          }
        }
      }

    }
  

  async function getSimpleFinAccessUrl() : Promise<{url: string, auth: string} | null> {
    const setupToken = prompt('Please enter your SimpleFin API setup token:');
    if (!setupToken) {
      return null;
    }
    const claimUrl = atob(setupToken);

    const response = await fetch(claimUrl, {
      method: "POST",
      headers: {
        "Content-Length": "0"
      }
    });

    const fullAccessUrl = await response.text();
    const atIndex = fullAccessUrl.indexOf('@');
    if (atIndex !== -1) {
        const accessUrl = "https://" + fullAccessUrl.substring(atIndex + 1);
        const clientSecret = fullAccessUrl.substring(8, atIndex);
        const auth = btoa(`${clientSecret}:`);
        return {"url": accessUrl, "auth": auth};
      }
      else
      {
        alert('Invalid SimpleFin access URL format');
        return null;
      }
  }

  async function clearSimpleFinData() {
    await db.setSetting(SIMPLE_FIN_API_URL_KEY, '');
    await db.setSetting(SIMPLE_FIN_AUTH_KEY, '');
    alert('SimpleFin data cleared');
  }

  async function clearAllData() {
    if (confirm('Are you sure you want to clear all data (not settings)? This action cannot be undone.')) {
      await db.accounts.clear();
      await db.balances.clear();
      await db.transactions.clear();
      alert('All data cleared');
    }
  }
</script>

<h1>FinDash</h1>
<p>Welcome to FinDash, your financial dashboard for tracking and managing your finances.</p>

<a href="/accounts/12345">Account page test</a>

<div>
  <button onclick={loadFromSimpleFin}>Get Data from SimpleFin</button>
  <button onclick={clearSimpleFinData}>Clear SimpleFin Credentials</button>
  <button onclick={clearAllData}>Clear All Data</button>
</div>

<h2>Create a New Account</h2>
<div>
  <label for="category">Category:</label>
  <select id="category" bind:value={selectedCategory}>
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
  <button onclick={createAccount}>Create Account</button>
</div>


{#each Object.values(Category) as category (category.id)}
  <CategoryDiv categoryName={category.name} currentBalances={currentBalances.filter(b => b.account.category === category.id)} />
{/each}



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
  <button onclick={createBalanceSnapshot}>Create Balance Snapshot</button>
</div>

<div>
  <label for="chart">Chart:</label>
  <div id="chart" bind:this={chartDiv} style="width:50%;"></div>
</div>
