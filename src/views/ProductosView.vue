<script setup>
import { onMounted, ref } from "vue";
import api from "../api/axios";

const productos = ref([]);
const vendedores = ref([]);

const nuevoProducto = ref({
  nombre: "",
  categoria: "IPHONE",
  marca: "Apple",
  modelo: "",
  capacidad: "",
  color: "",
  estadoProducto: "NUEVO",
  stock: 1,
  origenProducto: "COMPRA",
  precioCostoUsd: null,
  precioCostoPesos: null,
  precioVentaPesos: null,
  fechaIngreso: "",
  vendedor: {
    id: null
  }
});

const obtenerProductos = async () => {
  try {
    const response = await api.get("/productos");
    productos.value = response.data;
  } catch (error) {
    console.error("Error al obtener productos", error);
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

const guardarProducto = async () => {
  try {
    await api.post("/productos", nuevoProducto.value);

    nuevoProducto.value = {
      nombre: "",
      categoria: "IPHONE",
      marca: "Apple",
      modelo: "",
      capacidad: "",
      color: "",
      estadoProducto: "NUEVO",
      stock: 1,
      origenProducto: "COMPRA",
      precioCostoUsd: null,
      precioCostoPesos: null,
      precioVentaPesos: null,
      fechaIngreso: "",
      vendedor: {
        id: null
      }
    };

    obtenerProductos();

  } catch (error) {
    console.error("Error al guardar producto", error);
  }
};

onMounted(() => {
  obtenerProductos();
  obtenerVendedores();
});
</script>

<template>
  <div class="space-y-8">

    <div>
      <h1 class="text-3xl font-bold text-gray-900">
        Productos
      </h1>

      <p class="text-gray-500 mt-1">
        Gestión de productos, stock y precios
      </p>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 class="text-xl font-bold mb-5">
        Nuevo producto
      </h2>

      <form @submit.prevent="guardarProducto" class="grid grid-cols-4 gap-4">

        <input
          v-model="nuevoProducto.nombre"
          type="text"
          placeholder="Nombre"
          class="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
        />

        <select
          v-model="nuevoProducto.categoria"
          class="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
        >
          <option value="IPHONE">iPhone</option>
          <option value="SAMSUNG">Samsung</option>
          <option value="IPAD">iPad</option>
          <option value="MACBOOK">MacBook</option>
          <option value="PS5">PS5</option>
          <option value="ACCESORIO">Accesorio</option>
          <option value="OTRO">Otro</option>
        </select>

        <input
          v-model="nuevoProducto.marca"
          type="text"
          placeholder="Marca"
          class="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
        />

        <input
          v-model="nuevoProducto.modelo"
          type="text"
          placeholder="Modelo"
          class="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
        />

        <input
          v-model="nuevoProducto.capacidad"
          type="text"
          placeholder="Capacidad"
          class="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
        />

        <input
          v-model="nuevoProducto.color"
          type="text"
          placeholder="Color"
          class="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
        />

        <select
          v-model="nuevoProducto.estadoProducto"
          class="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
        >
          <option value="NUEVO">Nuevo</option>
          <option value="USADO">Usado</option>
        </select>

        <input
          v-model.number="nuevoProducto.stock"
          type="number"
          placeholder="Stock"
          class="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
        />

        <select
          v-model="nuevoProducto.origenProducto"
          class="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
        >
          <option value="COMPRA">Compra</option>
          <option value="CANJE">Canje</option>
        </select>

        <input
          v-model.number="nuevoProducto.precioCostoUsd"
          type="number"
          placeholder="Costo USD"
          class="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
        />

        <input
          v-model.number="nuevoProducto.precioCostoPesos"
          type="number"
          placeholder="Costo pesos"
          class="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
        />

        <input
          v-model.number="nuevoProducto.precioVentaPesos"
          type="number"
          placeholder="Precio venta"
          class="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
        />

        <input
          v-model="nuevoProducto.fechaIngreso"
          type="date"
          class="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
        />

        <select
          v-model.number="nuevoProducto.vendedor.id"
          class="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
        >
          <option :value="null">Seleccionar vendedor</option>

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
          class="col-span-4 bg-black text-white rounded-xl px-5 py-3 font-semibold hover:bg-zinc-800 transition"
        >
          Guardar producto
        </button>

      </form>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

      <table class="w-full text-left">

        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="p-4 text-sm font-semibold text-gray-600">Producto</th>
            <th class="p-4 text-sm font-semibold text-gray-600">Categoría</th>
            <th class="p-4 text-sm font-semibold text-gray-600">Estado</th>
            <th class="p-4 text-sm font-semibold text-gray-600">Stock</th>
            <th class="p-4 text-sm font-semibold text-gray-600">Costo</th>
            <th class="p-4 text-sm font-semibold text-gray-600">Venta</th>
            <th class="p-4 text-sm font-semibold text-gray-600">Vendedor</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="producto in productos"
            :key="producto.id"
            class="border-b border-gray-100 hover:bg-gray-50 transition"
          >
            <td class="p-4">
              <p class="font-semibold text-gray-900">
                {{ producto.nombre }}
              </p>
              <p class="text-sm text-gray-500">
                {{ producto.modelo }} - {{ producto.capacidad }} - {{ producto.color }}
              </p>
            </td>

            <td class="p-4 text-gray-700">
              {{ producto.categoria }}
            </td>

            <td class="p-4">
              <span class="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
                {{ producto.estadoProducto }}
              </span>
            </td>

            <td class="p-4 font-semibold">
              {{ producto.stock }}
            </td>

            <td class="p-4">
              <p>USD {{ producto.precioCostoUsd }}</p>
              <p class="text-sm text-gray-500">
                ${{ producto.precioCostoPesos }}
              </p>
            </td>

            <td class="p-4 font-semibold">
              ${{ producto.precioVentaPesos }}
            </td>

            <td class="p-4 text-gray-700">
              {{ producto.vendedor?.nombre || "Sin vendedor" }}
            </td>
          </tr>
        </tbody>

      </table>

    </div>

  </div>
</template>