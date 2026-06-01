<script setup>
import { onMounted, ref } from "vue";
import api from "../api/axios";

const vendedores = ref([]);

const obtenerVendedores = async () => {
  try {
    const response = await api.get("/vendedores");
    vendedores.value = response.data;
  } catch (error) {
    console.error("Error al obtener los vendedores", error);
  }
};

onMounted(() => {
  obtenerVendedores();
});
</script>

<template>
  <div class="space-y-6">

    <div>
      <h1 class="text-3xl font-bold text-gray-900">
        Clientes
      </h1>

      <p class="text-gray-500 mt-1">
        Vendedores
      </p>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

      <table class="w-full text-left">

        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="p-4 text-sm font-semibold text-gray-600">Nombre</th>
            <th class="p-4 text-sm font-semibold text-gray-600">Apellido</th>
            <th class="p-4 text-sm font-semibold text-gray-600">Telefono</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="vendedor in vendedores"
            :key="vendedor.id"
            class="border-b border-gray-100 hover:bg-gray-50 transition"
          >
            <td class="p-4">
              {{ vendedor.nombre }}
            </td>

            <td class="p-4">
              {{ vendedor.apellido }}
            </td>

            <td class="p-4">
              {{ vendedor.telefono }}
            </td>

          </tr>
        </tbody>

      </table>

    </div>

  </div>
</template>