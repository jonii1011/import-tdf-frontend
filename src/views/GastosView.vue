<script setup>
import { computed, onMounted, ref } from "vue";
import api from "../api/axios";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

import { Doughnut } from "vue-chartjs";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

const gastosDonutData = computed(() => {
  return {
    labels: gastosPorCategoria.value.map(item => item.categoria),
    datasets: [
      {
        data: gastosPorCategoria.value.map(item => item.total),
        backgroundColor: [
          "#18181b", // Negro (Alquiler)
          "#2563eb", // Azul (Publicidad)
          "#3f3f46", // Gris oscuro (Servicios)
          "#059669", // Verde (Compras)
          "#71717a", // Gris medio (Impuestos)
          "#d4d4d8"  // Gris claro (Otros)
        ],
        borderWidth: 0
      }
    ]
  };
});

const gastosDonutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "70%",
  plugins: {
    legend: {
      position: "bottom"
    }
  }
};

const gastos = ref([]);
const vendedores = ref([]);
const errorMensaje = ref("");

const nuevoGasto = ref({
  fecha: "",
  descripcion: "",
  categoriaGasto: "PUBLICIDAD",
  moneda: "PESOS",
  monto: null,
  cotizacionUsada: null,
  montoConvertidoPesos: null,
  gastoCompartido: false,
  vendedor: {
    id: null
  },
  observacion: ""
});

const obtenerGastos = async () => {
  try {
    const response = await api.get("/gastos");
    gastos.value = response.data;
  } catch (error) {
    console.error("Error al obtener gastos", error);
  }
};

const obtenerVendedores = async () => {
  try {
    const response = await api.get("/vendedores");
    vendedores.value = response.data;
  } catch (error) {
    console.error("Error al obtener vendedores", error);
  }
};

const limpiarFormulario = () => {
  nuevoGasto.value = {
    fecha: "",
    descripcion: "",
    categoriaGasto: "PUBLICIDAD",
    moneda: "PESOS",
    monto: null,
    cotizacionUsada: null,
    montoConvertidoPesos: null,
    vendedor: {
      id: null
    },
    observacion: ""
  };
};

const validarGasto = () => {
  if (!nuevoGasto.value.fecha) {
    errorMensaje.value = "Debe seleccionar una fecha.";
    return false;
  }

  if (!nuevoGasto.value.descripcion) {
    errorMensaje.value = "Debe ingresar una descripción.";
    return false;
  }

  if (!nuevoGasto.value.monto || nuevoGasto.value.monto <= 0) {
    errorMensaje.value = "Debe ingresar un monto mayor a 0.";
    return false;
  }

  if (nuevoGasto.value.moneda !== "PESOS") {
    if (!nuevoGasto.value.cotizacionUsada || nuevoGasto.value.cotizacionUsada <= 0) {
      errorMensaje.value = "Debe ingresar una cotización válida.";
      return false;
    }
  }

  errorMensaje.value = "";
  return true;
};

const guardarGasto = async () => {
  try {
    if (!validarGasto()) return;

    if (nuevoGasto.value.moneda === "PESOS") {
      nuevoGasto.value.montoConvertidoPesos = nuevoGasto.value.monto;
    } else {
      nuevoGasto.value.montoConvertidoPesos =
        nuevoGasto.value.monto * nuevoGasto.value.cotizacionUsada;
    }

    if (!nuevoGasto.value.vendedor.id) {
      nuevoGasto.value.vendedor = null;
    }

    await api.post("/gastos", nuevoGasto.value);

    limpiarFormulario();
    await obtenerGastos();
    mostrarFormulario.value = false;

  } catch (error) {
    console.error("Error al guardar gasto", error);
    errorMensaje.value = "Ocurrió un error al guardar el gasto.";
  }
};

const totalGastos = computed(() => {
  return gastos.value.reduce((total, gasto) => {
    return total + Number(gasto.montoConvertidoPesos || 0);
  }, 0);
});

const gastosPorCategoria = computed(() => {
  const categorias = {};

  gastos.value.forEach((gasto) => {
    const categoria = gasto.categoriaGasto || "SIN CATEGORIA";

    if (!categorias[categoria]) {
      categorias[categoria] = 0;
    }

    categorias[categoria] += Number(gasto.montoConvertidoPesos || 0);
  });

  return Object.keys(categorias).map((categoria) => ({
    categoria,
    total: categorias[categoria]
  }));
});

const formatearPesos = (valor) => {
  return new Intl.NumberFormat("es-AR").format(valor || 0);
};

const mostrarFormulario = ref(false);

onMounted(() => {
  obtenerGastos();
  obtenerVendedores();
});
</script>

<template>
  <div class="space-y-8 w-full max-w-7xl mx-auto">

    <div>
      <h1 class="text-3xl font-bold text-zinc-900 tracking-tight">
        Gastos
      </h1>

      <p class="text-zinc-500 mt-1">
        Control de gastos y egresos del negocio.
      </p>
    </div>

    <div
      v-if="errorMensaje"
      class="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700 font-medium"
    >
      {{ errorMensaje }}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div class="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6">
        <p class="text-sm text-zinc-500">
          Total gastos
        </p>

        <h2 class="text-4xl font-bold mt-3 text-red-600">
          ${{ formatearPesos(totalGastos) }}
        </h2>
      </div>

      <div class="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6">
        <p class="text-sm text-zinc-500">
          Cantidad de gastos
        </p>

        <h2 class="text-4xl font-bold mt-3 text-zinc-900">
          {{ gastos.length }}
        </h2>
      </div>

      <div class="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6">
        <p class="text-sm text-zinc-500">
          Categorías usadas
        </p>

        <h2 class="text-4xl font-bold mt-3 text-zinc-900">
          {{ gastosPorCategoria.length }}
        </h2>
      </div>
    </div>

    <div class="flex justify-end">
      <button
        type="button"
        @click="mostrarFormulario = !mostrarFormulario"
        class="bg-black text-white rounded-2xl px-5 py-3 font-bold hover:bg-zinc-800 transition"
      >
        {{ mostrarFormulario ? "Cancelar" : "+ Nuevo gasto" }}
      </button>
    </div>

    <section
  v-if="mostrarFormulario"
  class="bg-white rounded-3xl border border-zinc-200 shadow-sm p-8"
    >
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-zinc-900">
          Nuevo gasto
        </h2>

        <p class="text-sm text-zinc-500 mt-1">
          Registrá gastos del negocio, publicidad, servicios, compras o egresos generales.
        </p>
      </div>

      <form @submit.prevent="guardarGasto" class="space-y-6">

        <div class="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div>
            <label class="label">Fecha</label>
            <input
              v-model="nuevoGasto.fecha"
              type="date"
              class="input"
            />
          </div>

          <div>
            <label class="label">Descripción</label>
            <input
              v-model="nuevoGasto.descripcion"
              type="text"
              placeholder="Ej: Publicidad Meta Ads"
              class="input"
            />
          </div>

          <div>
            <label class="label">Categoría</label>
            <select
              v-model="nuevoGasto.categoriaGasto"
              class="input"
            >
              <option value="ALQUILER">Alquiler</option>
              <option value="PUBLICIDAD">Publicidad</option>
              <option value="INTERNET">Internet</option>
              <option value="SERVICIOS">Servicios</option>
              <option value="COMPRAS">Compras</option>
              <option value="OTROS">Otros</option>
            </select>
          </div>

          <div>
            <label class="label">Vendedor</label>
            <select
              v-model.number="nuevoGasto.vendedor.id"
              class="input"
            >
              <option :value="null">
                Sin vendedor
              </option>

              <option
                v-for="vendedor in vendedores"
                :key="vendedor.id"
                :value="vendedor.id"
              >
                {{ vendedor.nombre }} {{ vendedor.apellido }}
              </option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div>
            <label class="label">Moneda</label>
            <select
              v-model="nuevoGasto.moneda"
              class="input"
            >
              <option value="PESOS">Pesos</option>
              <option value="USD">USD</option>
              <option value="USDT">USDT</option>
            </select>
          </div>

          <div>
            <label class="label">Monto</label>
            <input
              v-model.number="nuevoGasto.monto"
              type="number"
              placeholder="Monto"
              class="input"
            />
          </div>

          <div>
            <label class="label">Cotización usada</label>
            <input
              v-model.number="nuevoGasto.cotizacionUsada"
              type="number"
              placeholder="Solo si no es pesos"
              class="input"
            />
          </div>

          <div>
            <label class="label">Compartido</label>

            <label class="flex items-center gap-2 mt-4 font-semibold text-zinc-700">
              <input
                v-model="nuevoGasto.gastoCompartido"
                type="checkbox"
              />

              Gasto compartido
            </label>
          </div>

          <div>
            <label class="label">Observación</label>
            <input
              v-model="nuevoGasto.observacion"
              type="text"
              placeholder="Opcional"
              class="input"
            />
          </div>
        </div>

        <button
          type="submit"
          class="w-full bg-black text-white rounded-2xl px-5 py-4 font-bold hover:bg-zinc-800 transition"
        >
          Guardar gasto
        </button>

      </form>
    </section>

    <section class="grid grid-cols-1 lg:grid-cols-2 gap-6">

  <div class="bg-white rounded-3xl border border-zinc-200 shadow-sm p-8">

    <h2 class="text-2xl font-bold text-zinc-900 mb-2">
      Gastos por categoría
    </h2>

    <p class="text-sm text-zinc-500 mb-8">
      Distribución total de gastos del negocio.
    </p>

    <div class="h-105 flex items-center justify-center">

      <Doughnut
        :data="gastosDonutData"
        :options="gastosDonutOptions"
      />

    </div>

  </div>

  <div class="bg-white rounded-3xl border border-zinc-200 shadow-sm p-8">

    <h2 class="text-2xl font-bold text-zinc-900 mb-2">
      Resumen categorías
    </h2>

    <p class="text-sm text-zinc-500 mb-8">
      Comparativa de gastos acumulados.
    </p>

    <div class="space-y-4">

      <div
        v-for="categoria in gastosPorCategoria"
        :key="categoria.categoria"
        class="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4"
      >

        <div>

          <p class="text-sm text-zinc-500">
            Categoría
          </p>

          <h3 class="font-bold text-zinc-900 mt-1">
            {{ categoria.categoria }}
          </h3>

        </div>

        <div class="text-right">

          <p class="text-sm text-zinc-500">
            Total
          </p>

          <h3 class="font-bold text-red-600 text-xl mt-1">
            ${{ formatearPesos(categoria.total) }}
          </h3>

        </div>

      </div>

    </div>

  </div>

</section>

    <section class="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
      <div class="p-6 border-b border-zinc-100">
        <h2 class="text-xl font-bold text-zinc-900">
          Historial de gastos
        </h2>
      </div>

      <table class="w-full text-left">
        <thead class="bg-zinc-50 border-b border-zinc-100">
          <tr>
            <th class="p-4 text-sm font-semibold text-zinc-600">Fecha</th>
            <th class="p-4 text-sm font-semibold text-zinc-600">Descripción</th>
            <th class="p-4 text-sm font-semibold text-zinc-600">Categoría</th>
            <th class="p-4 text-sm font-semibold text-zinc-600">Moneda</th>
            <th class="p-4 text-sm font-semibold text-zinc-600">Monto</th>
            <th class="p-4 text-sm font-semibold text-zinc-600">Vendedor</th>
            <th class="p-4 text-sm font-semibold text-zinc-600">Compartido</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="gasto in gastos"
            :key="gasto.id"
            class="border-b border-zinc-100 hover:bg-zinc-50 transition"
          >
            <td class="p-4 text-zinc-700">
              {{ gasto.fecha }}
            </td>

            <td class="p-4 font-semibold text-zinc-900">
              {{ gasto.descripcion }}
            </td>

            <td class="p-4 text-zinc-700">
              {{ gasto.categoriaGasto }}
            </td>

            <td class="p-4 text-zinc-700">
              {{ gasto.moneda }}
            </td>

            <td class="p-4 font-bold text-red-600">
              ${{ formatearPesos(gasto.montoConvertidoPesos) }}
            </td>

            <td class="p-4 text-zinc-700">
              {{ gasto.vendedor?.nombre || "Sin vendedor" }}
            </td>

            <td class="p-4 text-zinc-700">
              {{ gasto.gastoCompartido ? "Sí" : "No" }}
            </td>
          </tr>
        </tbody>
      </table>
    </section>

  </div>
</template>

<style scoped>
.label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #52525b;
  margin-bottom: 8px;
}

.input {
  width: 100%;
  border: 1px solid #e4e4e7;
  background: #fafafa;
  border-radius: 18px;
  padding: 14px 16px;
  outline: none;
}

.input:focus {
  border-color: black;
  box-shadow: 0 0 0 2px rgba(0,0,0,0.08);
}
</style>