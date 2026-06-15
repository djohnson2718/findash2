<script lang="ts">
  import type { CurrentBalance } from "$lib/db";
  import { Category } from "$lib/db";
  let { currentBalances }: { currentBalances: CurrentBalance[] } = $props();
</script>

<table class="custom-table">
  <tbody>
    {#each Object.values(Category) as category (category.id)}
      <tr class="category-table-line">
        <td>{category.name}</td>
        <td
          >${currentBalances
            .filter((b) => b.account.categoryId === category.id)
            .map((b) => b.amount)
            .reduce((a, b) => a + b, 0)
            .toLocaleString()}</td
        >
      </tr>
      {#each currentBalances.filter((b) => b.account.categoryId === category.id) as b}
        <tr>
          <td
            ><a class="cell-link" href={`/accounts/${b.account.id}`}
              >{b.account.name}</a
            ></td
          >
          <td>${b.amount.toLocaleString()}</td>
          <td>at {new Date(b.timestamp * 1000).toLocaleString()}</td>
          <td>${b.change.toLocaleString()}</td>
        </tr>
      {/each}
    {/each}
  </tbody>
</table>
