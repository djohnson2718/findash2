<script lang="ts">
    import { ChartColors } from "$lib";
    import type { ApexAxisChartSeries, ApexOptions } from "apexcharts";
    import ApexCharts from "apexcharts";
    import { onDestroy } from "svelte";

    let { series, width }: { series: ApexAxisChartSeries; width: string } =
        $props();

    let chartDiv: HTMLDivElement | null = $state(null);
    let chartInstance: ApexCharts | null = null;
    const lineChartOptions: ApexOptions = {
        chart: { type: "line", toolbar: { show: true } },
        stroke: { curve: "straight", width: 3 },
        markers: { size: 0 },
        dataLabels: { enabled: false },
        colors: ChartColors,
        legend: { position: "bottom", horizontalAlign: "center" },
        xaxis: {
            type: "datetime",
            title: { text: "Date" },
            tickAmount: 4,
            labels: {
                formatter: (val: number) =>
                    new Date(val * 1000).toLocaleDateString(),
            },
        },
        yaxis: {
            title: { text: "Balance" },
            labels: { formatter: (val: number) => `$${val.toLocaleString()}` },
        },
        tooltip: {
            y: { formatter: (value: number) => `$${value.toLocaleString()}` },
        },
    };

    $effect(() => {
        if (!chartDiv) return;
        if (!chartInstance) {
            chartInstance = new ApexCharts(chartDiv, {
                ...lineChartOptions,
                series: series,
            });
            chartInstance.render();
        } else {
            chartInstance.updateOptions({
                series: series,
            });
        }
    });
    onDestroy(() => {
        if (chartInstance) {
            chartInstance.destroy();
        }
    });
</script>

<div bind:this={chartDiv} style="width: {width}"></div>
