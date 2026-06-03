<script setup>
import { computed, onMounted, ref, watch } from "vue";
import api from "../api/axios";

const productos = ref([]);
const vendedores = ref([]);
const cotizacionActual = ref(null);

const obtenerCotizacionActual = async () => {
  try {
    const response = await api.get("/cotizaciones/actual");
    cotizacionActual.value = response.data.valorUsdt;
  } catch (error) {
    console.error("Error al obtener cotización", error);
  }
};

const costoPesosCalculado = computed(() => {
  if (!nuevoProducto.value.precioCostoUsd || !cotizacionActual.value) {
    return null;
  }

  return nuevoProducto.value.precioCostoUsd * cotizacionActual.value;
});

const esStockBajo = (producto) => {
  return producto.stock !== null && producto.stock > 0 && producto.stock <= 1;
};

const estaAgotado = (producto) => {
  return producto.stock === 0;
};

const nuevoProducto = ref({
  nombre: "iPhone",
  categoria: "IPHONE",
  marca: "Apple",
  modelo: "",
  capacidad: null,
  varianteProducto: null,
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

watch(
  () => nuevoProducto.value.categoria,
  (categoria) => {

    switch (categoria) {

      case "IPHONE":
      case "IPAD":
      case "MACBOOK":
        nuevoProducto.value.marca = "Apple";
        break;

      case "SAMSUNG":
        nuevoProducto.value.marca = "Samsung";
        break;

      case "PS5":
        nuevoProducto.value.marca = "Sony";
        break;

      default:
        nuevoProducto.value.marca = "";
    }

  }
);

watch(() => nuevoProducto.value.categoria, (categoria) => {

  switch (categoria) {

    case "IPHONE":
      nuevoProducto.value.nombre = "iPhone";
      break;

    case "IPAD":
      nuevoProducto.value.nombre = "iPad";
      break;

    case "MACBOOK":
      nuevoProducto.value.nombre = "MacBook";
      break;

    case "SAMSUNG":
      nuevoProducto.value.nombre = "Samsung";
      break;

    case "PS5":
      nuevoProducto.value.nombre = "PS5";
      break;

    default:
      nuevoProducto.value.nombre = categoria;
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

const obtenerProductos = async () => {
  try {
    const response = await api.get("/productos/stock");
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
    if (cotizacionActual.value && nuevoProducto.value.precioCostoUsd) {
      nuevoProducto.value.precioCostoPesos = costoPesosCalculado.value;
    }

    if (nuevoProducto.value.categoria !== "IPHONE") {
      nuevoProducto.value.varianteProducto = null;
    }

    await api.post("/productos", nuevoProducto.value);

    nuevoProducto.value = {
      nombre: "iPhone",
      categoria: "IPHONE",
      marca: "Apple",
      modelo: "",
      capacidad: null,
      color: "",
      estadoProducto: "NUEVO",
      varianteProducto: null,
      condicionBateria: null,
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

const productoEditando = ref(null);

const abrirEdicion = (producto) => {
  productoEditando.value = {
    ...producto,
    vendedor: producto.vendedor ? { id: producto.vendedor.id } : { id: null }
  };
};

const cancelarEdicion = () => {
  productoEditando.value = null;
};

const guardarEdicion = async () => {
  try {
    await api.put(
      `/productos/${productoEditando.value.id}`,
      productoEditando.value
    );

    productoEditando.value = null;

    await obtenerProductos();

  } catch (error) {
    console.error("Error al editar producto", error);
  }
};

const productosFiltrados = computed(() => {
  return productos.value.filter((producto) => {
    const coincideCategoria =
      filtroCategoria.value === "TODOS" ||
      producto.categoria === filtroCategoria.value;

    const coincideVendedor =
      filtroVendedor.value === "TODOS" ||
      producto.vendedor?.id === filtroVendedor.value;

    const texto = `
      ${producto.categoria}
      ${producto.marca}
      ${producto.modelo}
      ${producto.varianteProducto || ""}
      ${producto.capacidad}
      ${producto.color}
    `.toLowerCase();

    const coincideBusqueda = texto.includes(busqueda.value.toLowerCase());

    return coincideCategoria && coincideVendedor && coincideBusqueda;
  });
});

const resetearFiltros = () => {
  busqueda.value = "";
  filtroCategoria.value = "TODOS";
  filtroVendedor.value = "TODOS";
};

const mostrarFormulario = ref(false);
const busqueda = ref("");
const filtroCategoria = ref("TODOS");
const filtroVendedor = ref("TODOS");

onMounted(() => {
  obtenerProductos();
  obtenerVendedores();
  obtenerCotizacionActual();
});
</script>

<template>
  <div class="space-y-8 w-full max-w-7xl mx-auto">

    <div>
      <h1 class="text-3xl font-bold text-gray-900">
        Productos
      </h1>

      <p class="text-gray-500 mt-1">
        Gestión de productos, stock y precios
      </p>
    </div>

    <div class="flex items-center justify-between gap-4">

        <div class="flex gap-3">

          <input
            v-model="busqueda"
            type="text"
            placeholder="Buscar producto..."
            class="border border-zinc-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
          />

          <select
            v-model="filtroCategoria"
            class="border border-zinc-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
          >
            <option value="TODOS">Todos</option>
            <option value="IPHONE">iPhone</option>
            <option value="SAMSUNG">Samsung</option>
            <option value="IPAD">iPad</option>
            <option value="MACBOOK">MacBook</option>
            <option value="PS5">PS5</option>
            <option value="ACCESORIO">Accesorio</option>
            <option value="OTRO">Otro</option>
          </select>

          <select
              v-model="filtroVendedor"
              class="border border-zinc-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
            >
              <option value="TODOS">Todos los vendedores</option>

              <option
                v-for="vendedor in vendedores"
                :key="vendedor.id"
                :value="vendedor.id"
              >
                {{ vendedor.nombre }} {{ vendedor.apellido }}
              </option>
            </select>

            <button
              type="button"
              @click="resetearFiltros"
              class="border border-zinc-200 bg-white text-zinc-700 rounded-2xl px-5 py-3 font-bold hover:bg-zinc-100 transition"
            >
              Resetear
            </button>

        </div>

        <button
          type="button"
          @click="mostrarFormulario = !mostrarFormulario"
          class="bg-black text-white rounded-2xl px-5 py-3 font-bold hover:bg-zinc-800 transition"
        >
          {{ mostrarFormulario ? "Cancelar" : "+ Agregar producto" }}
        </button>

      </div>

    <div class="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 max-w-7xl mx-auto" 
    v-if="mostrarFormulario">
      <h2 class="text-xl font-bold mb-5">
        Nuevo producto
      </h2>

      <form
        @submit.prevent="guardarProducto"
        class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
      >

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
          readonly
          class="border border-gray-200 rounded-xl px-4 py-3 bg-gray-100"
        />

        <input
          v-model="nuevoProducto.modelo"
          type="text"
          placeholder="Modelo"
          class="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
        />

        <select
          v-if="nuevoProducto.categoria === 'IPHONE'"
          v-model="nuevoProducto.varianteProducto"
          class="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
        >
          <option :value="null">Seleccionar variante</option>
          <option value="NORMAL">Normal</option>
          <option value="PLUS">Plus</option>
          <option value="PRO">Pro</option>
          <option value="PRO_MAX">Pro Max</option>
        </select>

        <select
        v-model="nuevoProducto.capacidad"
        class="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black">
          <option :value="null">Seleccionar capacidad</option>
          <option value="128GB">128GB</option>
          <option value="256GB">256GB</option>
          <option value="512GB">512GB</option>
          <option value="1TB">1TB</option>
        </select>

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
            v-if="nuevoProducto.estadoProducto === 'USADO'"
            v-model.number="nuevoProducto.condicionBateria"
            type="number"
            min="0"
            max="100"
            placeholder="Condición batería (%)"
          />

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

        <div class="border border-zinc-200 rounded-xl px-4 py-3 bg-zinc-50">
          <p class="text-sm text-zinc-500">Cotización USDT</p>

          <strong>
            ${{ cotizacionActual || "Sin cotización" }}
          </strong>
        </div>

        <input
          :value="costoPesosCalculado"
          type="number"
          placeholder="Costo pesos automático"
          readonly
          class="border border-gray-200 rounded-xl px-4 py-3 bg-gray-100 outline-none"
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

            <div
        v-if="productoEditando"
        class="bg-white rounded-3xl shadow-sm border border-zinc-200 p-8"
      >
        <h2 class="text-xl font-bold mb-5">
          Editar producto
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

          <input
            v-model.number="productoEditando.precioVentaPesos"
            type="number"
            placeholder="Precio venta"
            class="border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
          />

          <input
            v-if="productoEditando.estadoProducto === 'USADO'"
            v-model.number="productoEditando.condicionBateria"
            type="number"
            placeholder="Batería (%)"
            class="border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
          />

          <input
            v-model.number="productoEditando.stock"
            type="number"
            placeholder="Stock"
            class="border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
          />

          <select
            v-model.number="productoEditando.vendedor.id"
            class="border border-zinc-200 rounded-xl px-4 py-3"
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

        <div class="flex gap-3 mt-5">

          <button
            type="button"
            @click="guardarEdicion"
            class="bg-black text-white rounded-xl px-5 py-3 font-bold hover:bg-zinc-800 transition"
          >
            Guardar cambios
          </button>

          <button
            type="button"
            @click="cancelarEdicion"
            class="border border-zinc-200 rounded-xl px-5 py-3 font-bold hover:bg-zinc-100 transition"
          >
            Cancelar
          </button>

        </div>
      </div>

      <table class="w-full text-center">

        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="p-4 text-sm font-semibold text-gray-600">Producto</th>
            <th class="p-4 text-sm font-semibold text-gray-600">Categoría</th>
            <th class="p-4 text-sm font-semibold text-gray-600">Estado</th>
            <th class="p-4 text-sm font-semibold text-gray-600">Stock</th>
            <th class="p-4 text-sm font-semibold text-gray-600">Costo</th>
            <th class="p-4 text-sm font-semibold text-gray-600">Venta</th>
            <th class="p-4 text-sm font-semibold text-gray-600">Vendedor</th>
            <th class="p-4 text-sm font-semibold text-gray-600 text-center">
              Acciones
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="producto in productosFiltrados"
            :key="producto.id"
            class="border-b border-gray-100 hover:bg-gray-50 transition"
          >
            <td class="p-4">
              <p class="font-semibold text-gray-900">
                  {{ producto.nombre }}

                  <span
                    v-if="producto.estadoProducto === 'USADO' && producto.condicionBateria"
                    class="ml-2 text-sm text-green-600"
                  >
                     {{ producto.condicionBateria }}%🔋
                  </span>
                </p>
              <p class="text-sm text-gray-500">
                {{ producto.modelo}}  {{ formatearVariante(producto.varianteProducto) }} - {{ producto.capacidad }} - {{ producto.color }}
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
                  <span
                    v-if="estaAgotado(producto)"
                    class="px-3 py-1 rounded-full text-sm bg-red-100 text-red-700"
                  >
                    Agotado
                  </span>

                  <span
                    v-else-if="esStockBajo(producto)"
                    class="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-700"
                  >
                    Stock bajo: {{ producto.stock }}
                  </span>

                  <span
                    v-else
                    class="px-3 py-1 rounded-full text-sm bg-green-100 text-green-700"
                  >
                    Disponible: {{ producto.stock }}
                  </span>

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
            <td class="p-4 text-center">
              <button
                type="button"
                @click="abrirEdicion(producto)"
                class="border border-zinc-200 rounded-xl px-4 py-2 font-semibold hover:bg-zinc-100 transition"
              >
                Editar
              </button>
            </td>
          </tr>
        </tbody>

      </table>

    </div>

  </div>
</template>