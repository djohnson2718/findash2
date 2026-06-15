<script lang="ts">
    import { Category } from "$lib/db";
    import type { ApexOptions } from "apexcharts";
    import type { Balance, CurrentBalance } from "$lib/db";
    import ApexCharts from "apexcharts";
    import { onDestroy } from "svelte";
    import { ChartColors } from "$lib";

    let {
        currentBalances,
        width,
    }: { currentBalances: CurrentBalance[]; width: string } = $props();

    let chartDiv: HTMLDivElement | null = $state(null);
    let chartInstance: ApexCharts | null = null;

    const pieChartOptions: ApexOptions = {
        chart: { type: "pie", toolbar: { show: false } },
        labels: Object.values(Category).map((c) => c.name),
        colors: ChartColors,
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

    $effect(() => {
        if (!chartDiv) return;
        if (!chartInstance) {
            chartInstance = new ApexCharts(chartDiv, {
                ...pieChartOptions,
                series: chartSeries,
            });
            chartInstance.render();
        } else {
            chartInstance.updateSeries(chartSeries);
        }
    });
    onDestroy(() => {
        if (chartInstance) {
            chartInstance.destroy();
        }
    });
</script>

<div bind:this={chartDiv} style="width: {width}"></div>
