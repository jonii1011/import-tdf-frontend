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

ChartJS.register(ArcElement, Tooltip, Legend);

const gastos = ref([]);
const gastosFijos = ref([]);
const vendedores = ref([]);
const errorMensaje = ref("");
const mostrarFormulario = ref(false);
const mostrarGastosFijos = ref(false);

const mesActual = new Date().getMonth() + 1;
const anioActual = new Date().getFullYear();

const nuevoGasto = ref({
  fecha: "",
  descripcion: "",
  categoriaGasto: "PUBLICIDAD",
  monto: null,
  mesCorrespondiente: mesActual,
  anioCorrespondiente: anioActual,
  tipoGasto: "VARIABLE",
  vendedor: {
    id: null
  }
});

const nuevoGastoFijo = ref({
  descripcion: "",
  categoriaGasto: "ALQUILER",
  monto: null,
  activo: true,
  diaPago: 5,
  vendedor: {
    id: null
  }
});

const mesGeneracion = ref(mesActual);
const anioGeneracion = ref(anioActual);

const obtenerGastos = async () => {
  const response = await api.get("/gastos");
  gastos.value = response.data;
};

const obtenerGastosFijos = async () => {
  const response = await api.get("/gastos-fijos");
  gastosFijos.value = response.data;
};

const obtenerVendedores = async () => {
  const response = await api.get("/vendedores");
  vendedores.value = response.data;
};

const limpiarFormulario = () => {
  nuevoGasto.value = {
    fecha: "",
    descripcion: "",
    categoriaGasto: "PUBLICIDAD",
    monto: null,
    mesCorrespondiente: mesActual,
    anioCorrespondiente: anioActual,
    tipoGasto: "VARIABLE",
    vendedor: {
      id: null
    }
  };
};

const limpiarGastoFijo = () => {
  nuevoGastoFijo.value = {
    descripcion: "",
    categoriaGasto: "ALQUILER",
    monto: null,
    activo: true,
    diaPago: 5,
    vendedor: {
      id: null
    }
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

  errorMensaje.value = "";
  return true;
};

const guardarGasto = async () => {
  try {
    if (!validarGasto()) return;

    const gastoEnviar = {
      ...nuevoGasto.value,
      vendedor: nuevoGasto.value.vendedor.id
        ? nuevoGasto.value.vendedor
        : null
    };

    await api.post("/gastos", gastoEnviar);

    limpiarFormulario();
    await obtenerGastos();
    mostrarFormulario.value = false;

  } catch (error) {
    console.error(error);
    errorMensaje.value = "Ocurrió un error al guardar el gasto.";
  }
};

const guardarGastoFijo = async () => {
  try {
    if (!nuevoGastoFijo.value.descripcion) {
      errorMensaje.value = "Debe ingresar una descripción.";
      return;
    }

    if (!nuevoGastoFijo.value.monto || nuevoGastoFijo.value.monto <= 0) {
      errorMensaje.value = "Debe ingresar un monto mayor a 0.";
      return;
    }

    const gastoFijoEnviar = {
      ...nuevoGastoFijo.value,
      vendedor: nuevoGastoFijo.value.vendedor.id
        ? nuevoGastoFijo.value.vendedor
        : null
    };

    await api.post("/gastos-fijos", gastoFijoEnviar);

    limpiarGastoFijo();
    await obtenerGastosFijos();

  } catch (error) {
    console.error(error);
    errorMensaje.value = "Ocurrió un error al guardar el gasto fijo.";
  }
};

const generarGastosFijos = async () => {
  try {
    await api.post(
      `/gastos-fijos/generar?mes=${mesGeneracion.value}&anio=${anioGeneracion.value}`
    );

    await obtenerGastos();
    errorMensaje.value = "";

  } catch (error) {
    console.error(error);
    errorMensaje.value = "Ocurrió un error al generar los gastos fijos.";
  }
};

const filtroMes = ref(mesActual);
const filtroAnio = ref(anioActual);

const gastosFiltrados = computed(() => {
  return gastos.value.filter((gasto) => {
    return (
      gasto.mesCorrespondiente === filtroMes.value &&
      gasto.anioCorrespondiente === filtroAnio.value
    );
  });
});

const eliminarGasto = async (id) => {
  try {
    await api.delete(`/gastos/${id}`);
    await obtenerGastos();
  } catch (error) {
    console.error("Error al eliminar gasto", error);
    errorMensaje.value = "Ocurrió un error al eliminar el gasto.";
  }
};

const eliminarGastoFijo = async (id) => {
  try {
    await api.delete(`/gastos-fijos/${id}`);
    await obtenerGastosFijos();
  } catch (error) {
    console.error(error);
    errorMensaje.value = "Ocurrió un error al eliminar el gasto fijo.";
  }
};

const totalGastos = computed(() => {
  return gastosFiltrados.value.reduce((total, gasto) => {
    return total + Number(gasto.monto || 0);
  }, 0);
});

const gastosPorCategoria = computed(() => {
  const categorias = {};

  gastosFiltrados.value.forEach((gasto) => {
    const categoria = gasto.categoriaGasto || "SIN CATEGORIA";

    if (!categorias[categoria]) {
      categorias[categoria] = 0;
    }

    categorias[categoria] += Number(gasto.monto || 0);
  });

  return Object.keys(categorias).map((categoria) => ({
    categoria,
    total: categorias[categoria]
  }));
});

const gastosDonutData = computed(() => {
  return {
    labels: gastosPorCategoria.value.map(item => item.categoria),
    datasets: [
      {
        data: gastosPorCategoria.value.map(item => item.total),
        backgroundColor: [
          "#18181b",
          "#2563eb",
          "#3f3f46",
          "#059669",
          "#71717a",
          "#d4d4d8"
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

const formatearPesos = (valor) => {
  return new Intl.NumberFormat("es-AR").format(valor || 0);
};

const obtenerNombreMes = (mes) => {
  const meses = {
    1: "Enero",
    2: "Febrero",
    3: "Marzo",
    4: "Abril",
    5: "Mayo",
    6: "Junio",
    7: "Julio",
    8: "Agosto",
    9: "Septiembre",
    10: "Octubre",
    11: "Noviembre",
    12: "Diciembre"
  };

  return meses[mes] || "";
};

onMounted(() => {
  obtenerGastos();
  obtenerGastosFijos();
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
        Control de gastos, egresos y gastos fijos del negocio.
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
          Gastos fijos configurados
        </p>

        <h2 class="text-4xl font-bold mt-3 text-zinc-900">
          {{ gastosFijos.length }}
        </h2>
      </div>
    </div>

    <div class="flex justify-end gap-3">
      <button
        type="button"
        @click="mostrarGastosFijos = !mostrarGastosFijos"
        class="border border-zinc-200 bg-white text-zinc-700 rounded-2xl px-5 py-3 font-bold hover:bg-zinc-100 transition"
      >
        {{ mostrarGastosFijos ? "Ocultar gastos fijos" : "Gastos fijos" }}
      </button>

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
          Registrá gastos del negocio y asigná a qué mes corresponden.
        </p>
      </div>

      <form @submit.prevent="guardarGasto" class="space-y-6">

        <div class="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div>
            <label class="label">Fecha de pago</label>
            <input
              v-model="nuevoGasto.fecha"
              type="date"
              class="input"
            />
          </div>

          <div>
            <label class="label">Mes correspondiente</label>
            <select
              v-model.number="nuevoGasto.mesCorrespondiente"
              class="input"
            >
              <option :value="1">Enero</option>
              <option :value="2">Febrero</option>
              <option :value="3">Marzo</option>
              <option :value="4">Abril</option>
              <option :value="5">Mayo</option>
              <option :value="6">Junio</option>
              <option :value="7">Julio</option>
              <option :value="8">Agosto</option>
              <option :value="9">Septiembre</option>
              <option :value="10">Octubre</option>
              <option :value="11">Noviembre</option>
              <option :value="12">Diciembre</option>
            </select>
          </div>

          <div>
            <label class="label">Año correspondiente</label>
            <input
              v-model.number="nuevoGasto.anioCorrespondiente"
              type="number"
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
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-5">
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
            <label class="label">Tipo de gasto</label>
            <select
              v-model="nuevoGasto.tipoGasto"
              class="input"
            >
              <option value="VARIABLE">Variable</option>
              <option value="FIJO">Fijo</option>
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

          <div>
            <label class="label">Monto</label>
            <input
              v-model.number="nuevoGasto.monto"
              type="number"
              placeholder="Monto"
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

    <section
      v-if="mostrarGastosFijos"
      class="bg-white rounded-3xl border border-zinc-200 shadow-sm p-8"
    >
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-zinc-900">
          Gastos fijos
        </h2>

        <p class="text-sm text-zinc-500 mt-1">
          Configurá gastos mensuales como alquiler, monotributo, internet u obra social.
        </p>
      </div>

      <form @submit.prevent="guardarGastoFijo" class="grid grid-cols-1 md:grid-cols-5 gap-5 mb-8">
        <input
          v-model="nuevoGastoFijo.descripcion"
          type="text"
          placeholder="Descripción"
          class="input"
        />

        <select
          v-model="nuevoGastoFijo.categoriaGasto"
          class="input"
        >
          <option value="ALQUILER">Alquiler</option>
          <option value="PUBLICIDAD">Publicidad</option>
          <option value="INTERNET">Internet</option>
          <option value="SERVICIOS">Servicios</option>
          <option value="COMPRAS">Compras</option>
          <option value="OTROS">Otros</option>
        </select>

        <input
          v-model.number="nuevoGastoFijo.monto"
          type="number"
          placeholder="Monto"
          class="input"
        />

        <input
          v-model.number="nuevoGastoFijo.diaPago"
          type="number"
          min="1"
          max="31"
          placeholder="Día de pago"
          class="input"
        />

        <select
          v-model.number="nuevoGastoFijo.vendedor.id"
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

        <button
          type="submit"
          class="md:col-span-5 bg-black text-white rounded-2xl px-5 py-4 font-bold hover:bg-zinc-800 transition"
        >
          Guardar gasto fijo
        </button>
      </form>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div>
          <label class="label">Mes a generar</label>
          <select
            v-model.number="mesGeneracion"
            class="input"
          >
            <option :value="1">Enero</option>
            <option :value="2">Febrero</option>
            <option :value="3">Marzo</option>
            <option :value="4">Abril</option>
            <option :value="5">Mayo</option>
            <option :value="6">Junio</option>
            <option :value="7">Julio</option>
            <option :value="8">Agosto</option>
            <option :value="9">Septiembre</option>
            <option :value="10">Octubre</option>
            <option :value="11">Noviembre</option>
            <option :value="12">Diciembre</option>
          </select>
        </div>

        <div>
          <label class="label">Año</label>
          <input
            v-model.number="anioGeneracion"
            type="number"
            class="input"
          />
        </div>

        <div class="md:col-span-2 flex items-end">
          <button
            type="button"
            @click="generarGastosFijos"
            class="w-full border border-zinc-200 bg-white text-zinc-700 rounded-2xl px-5 py-4 font-bold hover:bg-zinc-100 transition"
          >
            Generar gastos fijos del mes
          </button>
        </div>
      </div>

      <div class="space-y-4">
        <div
          v-for="gastoFijo in gastosFijos"
          :key="gastoFijo.id"
          class="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4"
        >
          <div>
            <h3 class="font-bold text-zinc-900">
              {{ gastoFijo.descripcion }}
            </h3>

            <p class="text-sm text-zinc-500 mt-1">
              {{ gastoFijo.categoriaGasto }}
              · Día {{ gastoFijo.diaPago }}
              · {{ gastoFijo.vendedor?.nombre || "Sin vendedor" }}
            </p>
          </div>

          <div class="text-right">
            <p class="font-bold text-red-600 text-xl">
              ${{ formatearPesos(gastoFijo.monto) }}
            </p>

            <p class="text-sm text-zinc-500">
              {{ gastoFijo.activo ? "Activo" : "Inactivo" }}
            </p>
          </div>

          <button
            type="button"
            @click="eliminarGastoFijo(gastoFijo.id)"
            class="border border-red-200 text-red-600 rounded-xl px-4 py-2 font-semibold hover:bg-red-50 transition"
          >
            Eliminar
          </button>
        </div>
      </div>
    </section>

    <section class="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <div class="bg-white rounded-3xl border border-zinc-200 shadow-sm p-8">
        <h2 class="text-2xl font-bold text-zinc-900 mb-2">
          Gastos por categoría
        </h2>

        <p class="text-sm text-zinc-500 mb-8">
          Distribución total de gastos del negocio.
        </p>

        <div class="h-[420px] flex items-center justify-center">
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

      <div class="flex justify-end gap-3 mb-5">

  <select
    v-model.number="filtroMes"
    class="input max-w-[200px]"
  >
    <option :value="1">Enero</option>
    <option :value="2">Febrero</option>
    <option :value="3">Marzo</option>
    <option :value="4">Abril</option>
    <option :value="5">Mayo</option>
    <option :value="6">Junio</option>
    <option :value="7">Julio</option>
    <option :value="8">Agosto</option>
    <option :value="9">Septiembre</option>
    <option :value="10">Octubre</option>
    <option :value="11">Noviembre</option>
    <option :value="12">Diciembre</option>
  </select>

  <input
    v-model.number="filtroAnio"
    type="number"
    class="input max-w-[160px]"
  />

</div>

      <table class="w-full text-left">
        <thead class="bg-zinc-50 border-b border-zinc-100">
          <tr>
            <th class="p-4 text-sm font-semibold text-zinc-600">Fecha</th>
            <th class="p-4 text-sm font-semibold text-zinc-600">Período</th>
            <th class="p-4 text-sm font-semibold text-zinc-600">Descripción</th>
            <th class="p-4 text-sm font-semibold text-zinc-600">Categoría</th>
            <th class="p-4 text-sm font-semibold text-zinc-600">Tipo</th>
            <th class="p-4 text-sm font-semibold text-zinc-600">Monto</th>
            <th class="p-4 text-sm font-semibold text-zinc-600">Vendedor</th>
            <th class="p-4 text-sm font-semibold text-zinc-600">Acciones</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="gasto in gastosFiltrados"
            :key="gasto.id"
            class="border-b border-zinc-100 hover:bg-zinc-50 transition"
          >
            <td class="p-4 text-zinc-700">
              {{ gasto.fecha }}
            </td>

            <td class="p-4 text-zinc-700">
              {{ obtenerNombreMes(gasto.mesCorrespondiente) }}
              {{ gasto.anioCorrespondiente }}
            </td>

            <td class="p-4 font-semibold text-zinc-900">
              {{ gasto.descripcion }}
            </td>

            <td class="p-4 text-zinc-700">
              {{ gasto.categoriaGasto }}
            </td>

            <td class="p-4 text-zinc-700">
              {{ gasto.tipoGasto }}
            </td>

            <td class="p-4 font-bold text-red-600">
              ${{ formatearPesos(gasto.monto) }}
            </td>

            <td class="p-4 text-zinc-700">
              {{ gasto.vendedor?.nombre || "Sin vendedor" }}
            </td>

            <td class="p-4">
              <button
                type="button"
                @click="eliminarGasto(gasto.id)"
                class="border border-red-200 text-red-600 rounded-xl px-4 py-2 font-semibold hover:bg-red-50 transition"
              >
                Eliminar
              </button>
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