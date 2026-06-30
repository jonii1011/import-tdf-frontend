<script setup>
import { onMounted, ref, watch } from "vue";
import api from "../api/axios";

const clientes = ref([]);
const mostrarFormulario = ref(false);
const busqueda = ref("");

const nuevoCliente = ref({
  nombre: "",
  apellido: "",
  telefono: "",
  dni: "",
  observacion: ""
});

const obtenerClientes = async () => {
  try {
    const texto = busqueda.value.trim();

    const response = texto.length >= 2
      ? await api.get("/clientes/buscar", {
          params: { texto }
        })
      : await api.get("/clientes");

    clientes.value = response.data;

  } catch (error) {
    console.error("Error al obtener clientes", error);
  }
};

watch(busqueda, () => {
  obtenerClientes();
});



const guardarCliente = async () => {
  try {
    await api.post("/clientes", nuevoCliente.value);

    nuevoCliente.value = {
      nombre: "",
      apellido: "",
      telefono: "",
      dni: "",
      observacion: ""
    };

    await obtenerClientes();

  } catch (error) {
    console.error("Error al guardar cliente", error);
  }
};

onMounted(() => {
  obtenerClientes();
});
</script>

<template>
  <div class="space-y-8 w-full max-w-7xl mx-auto">

    <div>
      <h1 class="text-3xl font-bold text-gray-900">
        Clientes
      </h1>

      <p class="text-gray-500 mt-1">
        Gestión de clientes del negocio
      </p>
    </div>

    <div class="flex items-center justify-between gap-4">

        <div class="flex gap-3">
          <input
            v-model="busqueda"
            type="text"
            placeholder="Buscar cliente por nombre o DNI"
            class="w-96 border border-zinc-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <button
          type="button"
          @click="mostrarFormulario = !mostrarFormulario"
          class="bg-black text-white rounded-2xl px-5 py-3 font-bold hover:bg-zinc-800 transition"
        >
          {{ mostrarFormulario ? "Cancelar" : "+ Agregar cliente" }}
        </button>

      </div>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
    v-if="mostrarFormulario">
      <h2 class="text-xl font-bold mb-5">
        Nuevo cliente
      </h2>

      <form @submit.prevent="guardarCliente" class="grid grid-cols-4 gap-4">

        <input
          v-model="nuevoCliente.nombre"
          type="text"
          placeholder="Nombre"
          class="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
        />

        <input
          v-model="nuevoCliente.apellido"
          type="text"
          placeholder="apellido"
          class="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
        />

        <input
          v-model="nuevoCliente.telefono"
          type="text"
          placeholder="Teléfono"
          class="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
        />

        <input
          v-model="nuevoCliente.dni"
          type="text"
          placeholder="DNI"
          class="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
        />

        <input
          v-model="nuevoCliente.observacion"
          type="text"
          placeholder="Observación"
          class="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
        />

        <button
          type="submit"
          class="col-span-4 bg-black text-white rounded-xl px-5 py-3 font-semibold hover:bg-zinc-800 transition"
        >
          Guardar cliente
        </button>

      </form>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

      <table class="w-full text-left">

        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="p-4 text-sm font-semibold text-gray-600">Nombre</th>
            <th class="p-4 text-sm font-semibold text-gray-600">Apellido</th>
            <th class="p-4 text-sm font-semibold text-gray-600">Teléfono</th>
            <th class="p-4 text-sm font-semibold text-gray-600">DNI</th>
            <th class="p-4 text-sm font-semibold text-gray-600">Observación</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="cliente in clientes"
            :key="cliente.id"
            class="border-b border-gray-100 hover:bg-gray-50 transition"
          >
            <td class="p-4 font-semibold text-gray-900">
              {{ cliente.nombre }}
            </td>

            <td class="p-4 font-semibold text-gray-900">
              {{ cliente.apellido }}
            </td>

            <td class="p-4 text-gray-700">
              {{ cliente.telefono }}
            </td>

            <td class="p-4 text-gray-700">
              {{ cliente.dni }}
            </td>

            <td class="p-4 text-gray-600">
              {{ cliente.observacion }}
            </td>
          </tr>
        </tbody>

      </table>

    </div>

  </div>
</template>