<script setup>
import { onMounted, ref } from "vue";
import api from "../api/axios";

const clientes = ref([]);

const nuevoCliente = ref({
  nombre: "",
  apellido: "",
  telefono: "",
  dni: "",
  observacion: ""
});

const obtenerClientes = async () => {
  try {
    const response = await api.get("/clientes");
    clientes.value = response.data;
  } catch (error) {
    console.error("Error al obtener clientes", error);
  }
};

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

    obtenerClientes();

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

    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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