<script setup>
import { computed, onMounted, ref } from "vue";
import api from "../api/axios";

import VentasChart from "../components/VentasChart.vue";
import TopProductosChart from "../components/TopProductosChart.vue";

const resumen = ref(null);
const ventasMensuales = ref([]);
const topProductos = ref([]);

const tipoPeriodo = ref("MES");

const formatearPesos = (valor) => {
  return new Intl.NumberFormat("es-AR").format(valor || 0);
};

const ticketPromedio = computed(() => {
  if (!resumen.value || resumen.value.totalNegocio.cantidadVentas === 0) {
    return 0;
  }

  return resumen.value.totalNegocio.ingresosTotales /
      resumen.value.totalNegocio.cantidadVentas;
});

const obtenerResumen = async () => {
  try {
    const response = await api.get(
      `/dashboard/resumen?tipo=${tipoPeriodo.value}`
    );

    resumen.value = response.data;

  } catch (error) {
    console.error(error);
  }
};

const obtenerVentasMensuales = async () => {
  try {
    const response = await api.get(
      "/dashboard/ventas-por-mes?anio=2026"
    );

    ventasMensuales.value = response.data;

  } catch (error) {
    console.error(error);
  }
};

const obtenerTopProductos = async () => {
  try {
    const response = await api.get(
      `/dashboard/top-productos?tipo=${tipoPeriodo.value}`
    );

    topProductos.value = response.data;

  } catch (error) {
    console.error(error);
  }
};

const cambiarPeriodo = async (tipo) => {
  tipoPeriodo.value = tipo;

  await obtenerResumen();
  await obtenerTopProductos();
};

onMounted(() => {
  obtenerResumen();
  obtenerVentasMensuales();
  obtenerTopProductos();
});
</script>

<template>
  <div class="space-y-8 w-full max-w-7xl mx-auto">

    <div class="flex items-center justify-between">

      <div>
        <h1 class="text-3xl font-bold text-zinc-900 tracking-tight">
          Dashboard
        </h1>

        <p class="text-zinc-500 mt-1">
          Resumen general del negocio
        </p>
      </div>

      <div class="flex gap-2 bg-white border border-zinc-200 rounded-2xl p-1 shadow-sm">

        <button
          @click="cambiarPeriodo('DIA')"
          class="px-4 py-2 rounded-xl font-semibold transition"
          :class="tipoPeriodo === 'DIA' ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100'"
        >
          Día
        </button>

        <button
          @click="cambiarPeriodo('SEMANA')"
          class="px-4 py-2 rounded-xl font-semibold transition"
          :class="tipoPeriodo === 'SEMANA' ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100'"
        >
          Semana
        </button>

        <button
          @click="cambiarPeriodo('MES')"
          class="px-4 py-2 rounded-xl font-semibold transition"
          :class="tipoPeriodo === 'MES' ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100'"
        >
          Mes
        </button>

      </div>

    </div>

    <div
      v-if="resumen"
      class="grid grid-cols-1 md:grid-cols-3 gap-5"
    >

      <div class="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6">
        <p class="text-zinc-500 text-sm">Ventas</p>

        <h2 class="text-3xl font-bold mt-2 text-zinc-900">
          {{ resumen.totalNegocio.cantidadVentas }}
        </h2>
      </div>

      <div class="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6">
        <p class="text-zinc-500 text-sm">Ingresos</p>

        <h2 class="text-3xl font-bold mt-2 text-zinc-900">
          ${{ formatearPesos(resumen.totalNegocio.ingresosTotales) }}
        </h2>
      </div>

      <div class="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6">
        <p class="text-zinc-500 text-sm">Ganancia</p>

        <h2 class="text-3xl font-bold mt-2 text-green-600">
          ${{ formatearPesos(resumen.totalNegocio.gananciaTotal) }}
        </h2>
      </div>

    </div>

    <section class="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <div class="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6">
        <h2 class="text-2xl font-bold text-zinc-900 mb-2">
          Ventas por mes
        </h2>

        <p class="text-sm text-zinc-500 mb-6">
          Evolución mensual de ingresos.
        </p>

        <VentasChart
          :ventasMensuales="ventasMensuales"
        />
      </div>

      <div class="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6">
        <h2 class="text-2xl font-bold text-zinc-900 mb-2">
          Top equipos vendidos
        </h2>

        <p class="text-sm text-zinc-500 mb-6">
          Equipos más vendidos según el período seleccionado.
        </p>

        <TopProductosChart
          :productos="topProductos"
        />
      </div>

    </section>

    <section
      v-if="resumen"
      class="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6"
    >

      <h2 class="text-2xl font-bold text-zinc-900 mb-5">
        Totales por vendedor
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">

        <div
          v-for="vendedor in resumen.totalesPorVendedor"
          :key="vendedor.vendedorId"
          class="rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4"
        >

          <div class="flex items-center justify-between mb-3">

            <h3 class="text-lg font-bold text-zinc-900">
              {{ vendedor.vendedorNombre }}
            </h3>

            <span class="bg-black text-white px-3 py-1 rounded-xl text-sm font-bold">
              {{ vendedor.cantidadVentas }} ventas
            </span>

          </div>

          <div class="grid grid-cols-3 gap-3 text-sm text-zinc-600">

            <p>
              Productos:
              <strong class="text-zinc-900">
                {{ vendedor.productosVendidos }}
              </strong>
            </p>

            <p>
              Ingresos:
              <strong class="text-zinc-900">
                ${{ formatearPesos(vendedor.ingresosTotales) }}
              </strong>
            </p>

            <p>
              Ganancia:
              <strong class="text-green-600">
                ${{ formatearPesos(vendedor.gananciaTotal) }}
              </strong>
            </p>

          </div>

        </div>

      </div>

    </section>

  </div>
</template>