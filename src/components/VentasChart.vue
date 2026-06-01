<script setup>

import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from "chart.js";

import { Bar } from "vue-chartjs";

import { computed } from "vue";

ChartJS.register(
    Title,
    Tooltip,
    Legend,
    BarElement,
    CategoryScale,
    LinearScale
);

const props = defineProps({
  ventasMensuales: {
    type: Array,
    required: true
  }
});

const chartData = computed(() => {

  return {

    labels: props.ventasMensuales.map(
        item => item.nombreMes
    ),

    datasets: [
      {
        label: "Ventas",
        data: props.ventasMensuales.map(
            item => item.totalVentas
        ),
        backgroundColor: "#111111",
        borderRadius: 10
      }
    ]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,

  plugins: {
    legend: {
      display: false
    }
  },

  scales: {
    y: {
      beginAtZero: true
    }
  }
};

</script>

<template>

  <div class="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">

    <h2 class="text-2xl font-bold mb-6">
      Ventas por mes
    </h2>

    <div class="h-80">
        <Bar
            :data="chartData"
            :options="chartOptions"
        />
        </div>

  </div>

</template>