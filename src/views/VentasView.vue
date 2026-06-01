<script setup>
import { onMounted, ref, computed } from "vue";
import api from "../api/axios";

const ventas = ref([]);
const clientes = ref([]);
const vendedores = ref([]);
const productos = ref([]);
const errorMensaje = ref("");

const usarCanje = ref(false);

const nuevaVenta = ref({
  fecha: "",
  clienteId: null,
  vendedorId: null,
  cotizacionDolar: null,
  observacion: "",
  productos: [{ productoId: null, precioVentaPesos: null }],
  pagos: [{ metodoPago: "TRANSFERENCIA", moneda: "PESOS", monto: null, cotizacionUsada: null }],
  productoCanje: null
});

const productoCanje = ref({
  nombre: "",
  categoria: "IPHONE",
  marca: "Apple",
  modelo: "",
  capacidad: "",
  color: "",
  valorTomadoPesos: null,
  precioVentaEstimadoPesos: null,
  observacion: ""
});

const obtenerVentas = async () => ventas.value = (await api.get("/ventas")).data;
const obtenerClientes = async () => clientes.value = (await api.get("/clientes")).data;
const obtenerVendedores = async () => vendedores.value = (await api.get("/vendedores")).data;
const obtenerProductos = async () => productos.value = (await api.get("/productos")).data;

const agregarProducto = () => {
  nuevaVenta.value.productos.push({ productoId: null, precioVentaPesos: null });
};

const agregarPago = () => {
  nuevaVenta.value.pagos.push({
    metodoPago: "TRANSFERENCIA",
    moneda: "PESOS",
    monto: null,
    cotizacionUsada: nuevaVenta.value.cotizacionDolar
  });
};

const validarVenta = () => {
  if (!nuevaVenta.value.fecha) return errorMensaje.value = "Debe seleccionar una fecha.", false;
  if (!nuevaVenta.value.clienteId) return errorMensaje.value = "Debe seleccionar un cliente.", false;
  if (!nuevaVenta.value.vendedorId) return errorMensaje.value = "Debe seleccionar un vendedor.", false;

  for (const producto of nuevaVenta.value.productos) {
    if (!producto.productoId) return errorMensaje.value = "Debe seleccionar un producto.", false;
    if (!producto.precioVentaPesos || producto.precioVentaPesos <= 0) {
      return errorMensaje.value = "El precio de venta debe ser mayor a 0.", false;
    }
  }

  for (const pago of nuevaVenta.value.pagos) {
    if (!pago.monto || pago.monto <= 0) {
      return errorMensaje.value = "El monto del pago debe ser mayor a 0.", false;
    }
  }

  if (usarCanje.value) {
    if (!productoCanje.value.nombre) return errorMensaje.value = "Debe cargar el nombre del producto recibido.", false;
    if (!productoCanje.value.valorTomadoPesos || productoCanje.value.valorTomadoPesos <= 0) {
      return errorMensaje.value = "Debe cargar el valor tomado del canje.", false;
    }
  }

  errorMensaje.value = "";
  return true;
};

const limpiarFormulario = () => {
  usarCanje.value = false;

  nuevaVenta.value = {
    fecha: "",
    clienteId: null,
    vendedorId: null,
    cotizacionDolar: null,
    observacion: "",
    productos: [{ productoId: null, precioVentaPesos: null }],
    pagos: [{ metodoPago: "TRANSFERENCIA", moneda: "PESOS", monto: 0, cotizacionUsada: 1470 }],
    productoCanje: null
  };

  productoCanje.value = {
    nombre: "",
    categoria: "IPHONE",
    marca: "Apple",
    modelo: "",
    capacidad: "",
    color: "",
    valorTomadoPesos: null,
    precioVentaEstimadoPesos: null,
    observacion: ""
  };
};

const guardarVenta = async () => {
  try {
    if (!validarVenta()) return;

    nuevaVenta.value.productoCanje = usarCanje.value ? productoCanje.value : null;

    await api.post("/ventas", nuevaVenta.value);

    limpiarFormulario();
    await obtenerVentas();
    await obtenerProductos();

  } catch (error) {
    console.error(error);
    errorMensaje.value = "Ocurrió un error al guardar la venta.";
  }
};

const eliminarProducto = (index) => {
  if (nuevaVenta.value.productos.length > 1) {
    nuevaVenta.value.productos.splice(index, 1);
  }
};

const eliminarPago = (index) => {
  if (nuevaVenta.value.pagos.length > 1) {
    nuevaVenta.value.pagos.splice(index, 1);
  }
};

const totalProductos = computed(() => {
  return nuevaVenta.value.productos.reduce((total, producto) => {
    return total + Number(producto.precioVentaPesos || 0);
  }, 0);
});

const totalPagos = computed(() => {
  return nuevaVenta.value.pagos.reduce((total, pago) => {
    return total + Number(pago.monto || 0);
  }, 0);
});

const diferenciaPago = computed(() => {
  return totalProductos.value - totalPagos.value;
});

const formatearPesos = (valor) => {
  return new Intl.NumberFormat("es-AR").format(valor);
};

onMounted(() => {
  obtenerVentas();
  obtenerClientes();
  obtenerVendedores();
  obtenerProductos();
});
</script>

<template>
  <div class="space-y-8 w-full max-w-7xl mx-auto">

    <div>
      <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Ventas</h1>
      <p class="text-gray-500 mt-1">Registrá ventas, pagos, canjes y consultá el historial.</p>
    </div>

    <div
      v-if="errorMensaje"
      class="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700 font-medium"
    >
      {{ errorMensaje }}
    </div>

    <section class="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-gray-900">Nueva venta</h2>
        <p class="text-sm text-gray-500 mt-1">Completá los datos principales de la operación.</p>
      </div>

      <form @submit.prevent="guardarVenta" class="space-y-8">

        <div class="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div>
            <label class="label">Fecha</label>
            <input v-model="nuevaVenta.fecha" type="date" class="input" />
          </div>

          <div>
            <label class="label">Cliente</label>
            <select v-model.number="nuevaVenta.clienteId" class="input">
              <option :value="null">Seleccionar cliente</option>
              <option v-for="cliente in clientes" :key="cliente.id" :value="cliente.id">
                {{ cliente.nombre }} {{ cliente.apellido }}
              </option>
            </select>
          </div>

          <div>
            <label class="label">Vendedor</label>
            <select v-model.number="nuevaVenta.vendedorId" class="input">
              <option :value="null">Seleccionar vendedor</option>
              <option v-for="vendedor in vendedores" :key="vendedor.id" :value="vendedor.id">
                {{ vendedor.nombre }} {{ vendedor.apellido }}
              </option>
            </select>
          </div>

          <div>
            <label class="label">Cotización dólar</label>
            <input v-model.number="nuevaVenta.cotizacionDolar" type="number" class="input" placeholder="Cotización"/>
          </div>
        </div>

        <div class="box">
          <div class="box-header">
            <div>
              <h3 class="box-title">Productos vendidos</h3>
              <p class="box-subtitle">Seleccioná los productos vendidos en esta operación.</p>
            </div>

            <button type="button" @click="agregarProducto" class="btn-secondary">
              + Producto
            </button>
          </div>

          <div
              v-for="(productoVenta, index) in nuevaVenta.productos"
              :key="index"
              class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4"
            >

              <select
                v-model.number="productoVenta.productoId"
                class="input bg-white"
              >
                <option :value="null">
                  Seleccionar producto
                </option>

                <option
                  v-for="producto in productos"
                  :key="producto.id"
                  :value="producto.id"
                  :disabled="producto.stock <= 0"
                >
                  {{ producto.nombre }} - {{ producto.modelo }} - Stock: {{ producto.stock }}
                </option>

              </select>

              <input
                v-model.number="productoVenta.precioVentaPesos"
                type="number"
                placeholder="Precio vendido"
                class="input bg-white"
              />

              <button
                type="button"
                @click="eliminarProducto(index)"
                class="bg-white border border-zinc-200 rounded-2xl px-4 py-3 hover:bg-red-50 hover:text-red-600 transition"
              >
                Eliminar
              </button>

            </div>
        </div>

        <div class="box">
          <div class="box-header">
            <div>
              <h3 class="box-title">Pagos</h3>
              <p class="box-subtitle">Podés cargar pagos combinados.</p>
            </div>

            <button type="button" @click="agregarPago" class="btn-secondary">
              + Pago
            </button>
          </div>

          <div
            v-for="(pago, index) in nuevaVenta.pagos"
            :key="index"
            class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4"
          >
            <select v-model="pago.metodoPago" class="input bg-white">
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="USDT">USDT</option>
              <option value="TARJETA_CREDITO">Tarjeta crédito</option>
              <option value="PLAN_CANJE">Plan canje</option>
            </select>

            <select v-model="pago.moneda" class="input bg-white">
              <option value="PESOS">Pesos</option>
              <option value="USD">USD</option>
              <option value="USDT">USDT</option>
            </select>

            <input v-model.number="pago.monto" type="number" placeholder="Monto" class="input bg-white" />

            <input v-model.number="pago.cotizacionUsada" type="number" placeholder="Cotización" class="input bg-white" />

            <button
              type="button"
              @click="eliminarPago(index)"
              class="bg-white border border-zinc-200 rounded-2xl px-4 py-3 hover:bg-red-50 hover:text-red-600 transition"
            >
              Eliminar
            </button>
          </div>
        </div>

        <div class="box border-dashed">
          <div class="flex items-center justify-between mb-5">
            <div>
              <h3 class="box-title">Plan canje</h3>
              <p class="box-subtitle">Cargá el equipo recibido si la venta incluye canje.</p>
            </div>

            <label class="flex items-center gap-2 text-sm font-semibold cursor-pointer">
              <input v-model="usarCanje" type="checkbox" class="w-4 h-4" />
              Usar canje
            </label>
          </div>

          <div v-if="usarCanje" class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input v-model="productoCanje.nombre" type="text" placeholder="Nombre equipo recibido" class="input bg-white" />

            <select v-model="productoCanje.categoria" class="input bg-white">
              <option value="IPHONE">iPhone</option>
              <option value="SAMSUNG">Samsung</option>
              <option value="IPAD">iPad</option>
              <option value="MACBOOK">MacBook</option>
              <option value="PS5">PS5</option>
              <option value="ACCESORIO">Accesorio</option>
              <option value="OTRO">Otro</option>
            </select>

            <input v-model="productoCanje.modelo" type="text" placeholder="Modelo" class="input bg-white" />
            <input v-model="productoCanje.capacidad" type="text" placeholder="Capacidad" class="input bg-white" />
            <input v-model="productoCanje.color" type="text" placeholder="Color" class="input bg-white" />

            <input
              v-model.number="productoCanje.valorTomadoPesos"
              type="number"
              placeholder="Valor tomado"
              class="input bg-white"
            />

            <input
              v-model.number="productoCanje.precioVentaEstimadoPesos"
              type="number"
              placeholder="Precio estimado venta"
              class="input bg-white"
            />

            <input
              v-model="productoCanje.observacion"
              type="text"
              placeholder="Observación"
              class="input bg-white"
            />
          </div>
        </div>

        <input
          v-model="nuevaVenta.observacion"
          type="text"
          placeholder="Observación de la venta"
          class="input"
        />

        <div class="grid grid-cols-3 gap-4">
          <div class="bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
            <p class="text-sm text-zinc-500">Total productos</p>
            <h3 class="text-2xl font-bold">${{ formatearPesos(totalProductos) }}</h3>
          </div>

          <div class="bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
            <p class="text-sm text-zinc-500">Total pagos</p>
            <h3 class="text-2xl font-bold">${{ formatearPesos(totalPagos) }}</h3>
          </div>

          <div class="bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
            <p class="text-sm text-zinc-500">Diferencia</p>
            <h3
              class="text-2xl font-bold"
              :class="diferenciaPago === 0 ? 'text-green-600' : 'text-red-600'"
            >
              ${{ formatearPesos(diferenciaPago) }} 
            </h3>
          </div>
        </div>

        <button type="submit" class="btn-primary">
          Guardar venta
        </button>

      </form>
    </section>

    <section class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="p-6 border-b border-gray-100">
        <h2 class="text-xl font-bold text-gray-900">Historial de ventas</h2>
      </div>

      <table class="w-full text-left">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="th">Fecha</th>
            <th class="th">Cliente</th>
            <th class="th">Vendedor</th>
            <th class="th">Pagos</th>
            <th class="th">Total</th>
            <th class="th">Ganancia</th>
            <th class="th">Observación</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="venta in ventas" :key="venta.id" class="border-b border-gray-100 hover:bg-gray-50">
            <td class="td">{{ venta.fecha }}</td>
            <td class="td font-semibold">{{ venta.cliente?.nombre }} {{ venta.cliente?.apellido }}</td>
            <td class="td">{{ venta.vendedor?.nombre }}</td>

            <td class="td">
              <div v-for="pago in venta.pagos" :key="pago.id" class="text-sm">
                {{ pago.metodoPago }} - ${{ pago.monto }}
              </div>
            </td>

            <td class="td font-bold">${{ venta.totalVentaPesos }}</td>
            <td class="td font-bold text-green-600">${{ venta.gananciaTotalPesos }}</td>
            <td class="td text-gray-500">{{ venta.observacion }}</td>
          </tr>
        </tbody>
      </table>
    </section>

  </div>
</template>

<style scoped>

.label {
  font-size: 14px;
  font-weight: 600;
  color: #52525b;
  display: block;
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
  box-shadow: 0 0 0 2px rgba(0,0,0,0.1);
}

.box {
  background: #fafafa;
  border: 1px solid #e4e4e7;
  border-radius: 24px;
  padding: 24px;
}

.box-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.box-title {
  font-size: 18px;
  font-weight: 700;
  color: #18181b;
}

.box-subtitle {
  font-size: 14px;
  color: #71717a;
  margin-top: 4px;
}

.btn-primary {
  width: 100%;
  background: black;
  color: white;
  border: none;
  border-radius: 18px;
  padding: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s;
}

.btn-primary:hover {
  background: #27272a;
}

.btn-secondary {
  background: black;
  color: white;
  border: none;
  border-radius: 16px;
  padding: 10px 16px;
  font-weight: 600;
  cursor: pointer;
}

.btn-secondary:hover {
  background: #27272a;
}

.th {
  padding: 16px;
  font-size: 14px;
  font-weight: 600;
  color: #71717a;
}

.td {
  padding: 16px;
  color: #3f3f46;
}

</style>