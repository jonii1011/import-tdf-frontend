<script setup>
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";

import { computed } from "vue";
import { Bar } from "vue-chartjs";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

const props = defineProps({
  productos: {
    type: Array,
    required: true
  }
});

const chartData = computed(() => {
  return {
    labels: props.productos.map(
      producto => `${producto.nombreProducto}`
    ),
    datasets: [
      {
        data: props.productos.map(
          producto => producto.cantidadVendida
        ),
        backgroundColor: "#18181b",
        borderRadius: 8
      }
    ]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: "y",
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    x: {
      beginAtZero: true,
      ticks: {
        precision: 0
      }
    }
  }
};
</script>

<template>
  <div class="h-80">
    <Bar
      :data="chartData"
      :options="chartOptions"
    />
  </div>
</template>