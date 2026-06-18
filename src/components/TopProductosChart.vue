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

const formatearVariante = (variante) => {
  switch (variante) {
    case "PRO_MAX":
      return "Pro Max";
    case "PRO":
      return "Pro";
    case "PLUS":
      return "Plus";
    default:
      return "";
  }
};

const nombreProducto = (producto) => {
  return `
    ${producto.nombreProducto || ""}
    ${producto.modelo || ""}
    ${formatearVariante(producto.varianteProducto)}
    ${producto.capacidad || ""}
  `.replace(/\s+/g, " ").trim();
};

const chartData = computed(() => {
  return {
    labels: props.productos.map((producto) => nombreProducto(producto)),
    datasets: [
      {
        data: props.productos.map((producto) => producto.cantidadVendida),
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
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          return `${context.raw} ventas`;
        }
      }
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