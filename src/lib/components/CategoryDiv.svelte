<script lang="ts">
    import type { CurrentBalance } from "$lib/db";
    let {categoryName, currentBalances} : { categoryName: string; currentBalances: CurrentBalance[] } = $props();
</script>

<div class="category-div">
  <h2>{categoryName}</h2>
  <p>Total Balance: ${currentBalances.reduce((sum, b) => sum + b.amount, 0).toLocaleString()}</p>

    {#if currentBalances.length === 0}
        <p>No accounts in this category.</p>
    {:else}
        <ul>
        {#each currentBalances as b}
            <li>{b.account.name}: ${b.amount.toLocaleString()} (at {new Date(b.timestamp).toLocaleString()}) 
                <a href={`/accounts/${b.account.id}`}>View Details</a>
            </li>
        {/each}
        </ul>
    {/if}
</div>