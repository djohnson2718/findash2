<script lang="ts">
  const props = $props();
</script>
<style>
    /* Base table styling */
.custom-table {
  width: 100%;
  border-collapse: collapse; /* Merges cell borders into a single clean line */
  margin: 25px 0;
  font-size: 16px;
  font-family: sans-serif;
  min-width: 400px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
}

/* Header configuration */
.custom-table thead tr {
  background-color: #009879;
  color: #ffffff;
  text-align: left;
  font-weight: bold;
}

/* Padding and spacing for headers and cells */
.custom-table th,
.custom-table td {
  padding: 12px 15px;
}

/* Zebra striping - colors every alternate row */
.custom-table tbody tr:nth-of-type(even) {
  background-color: #f3f3f3;
}

/* Subtle border at the bottom of each row */
.custom-table tbody tr {
  border-bottom: 1px solid #dddddd;
}

/* Hover effect to highlight the current row */
.custom-table tbody tr:hover {
  background-color: #f1f1f1;
  cursor: pointer;
}

/* Highlights the final row of the table */
.custom-table tbody tr:last-of-type {
  border-bottom: 2px solid #009879;
}
</style>

<h1>Account details for { props.data.account.name } </h1>

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
                <td>{new Date(t.timestamp*1000).toLocaleString()}</td>
                <td>{t.timestamp}</td>
            </tr>
        {/each}
    </tbody>
    </table>
</div>