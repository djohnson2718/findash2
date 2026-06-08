<script lang="ts">
    import type { CurrentBalance } from "$lib/db";
    let {categoryName, currentBalances} : { categoryName: string; currentBalances: CurrentBalance[] } = $props();
</script>

<table class="category-div">
  <thead><tr><th colspan="2">{categoryName}</th> <th>  ${currentBalances.reduce((sum, b) => sum + b.amount, 0).toLocaleString()}</th></tr></thead>
  <tbody>
    {#each currentBalances as b}
      <tr>
        <td>{b.account.name}</td>
        <td>${b.amount.toLocaleString()}</td>
        <td>at {new Date(b.timestamp).toLocaleString()}</td>
        <td><a href={`/accounts/${b.account.id}`}>View Details</a></td>
      </tr>
    {/each}

  </tbody>
</table>