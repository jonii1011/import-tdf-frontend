<script setup>
import { onMounted, ref, computed } from "vue";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
  nombre: "iPhone",
  categoria: "IPHONE",
  marca: "Apple",
  modelo: "",
  varianteProducto: null,
  capacidad: "",
  color: "",
  condicionBateria: null,
  valorTomadoPesos: null,
  precioVentaEstimadoPesos: null,
  observacion: ""
});

const obtenerVentas = async () => ventas.value = (await api.get("/ventas")).data;
const obtenerClientes = async () => clientes.value = (await api.get("/clientes")).data;
const obtenerVendedores = async () => vendedores.value = (await api.get("/vendedores")).data;
const obtenerProductos = async () => productos.value = (await api.get("/productos/stock")).data;

const agregarProducto = () => {
  nuevaVenta.value.productos.push({ productoId: null, precioVentaPesos: null });
  busquedasProductosVenta.value.push("");
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
  busquedaClienteVenta.value = "";
  busquedasProductosVenta.value = [""];

  nuevaVenta.value = {
    fecha: "",
    clienteId: null,
    vendedorId: null,
    cotizacionDolar: cotizacionActual.value,
    observacion: "",
    productos: [{ productoId: null, precioVentaPesos: null }],
    pagos: [{
      metodoPago: "TRANSFERENCIA",
      moneda: "PESOS",
      monto: null,
      cotizacionUsada: cotizacionActual.value
    }],
    productoCanje: null
  };

  productoCanje.value = {
    nombre: "iPhone",
    categoria: "IPHONE",
    marca: "Apple",
    modelo: "",
    varianteProducto: null,
    capacidad: "",
    color: "",
    condicionBateria: null,
    valorTomadoPesos: null,
    precioVentaEstimadoPesos: null,
    observacion: ""
  };
};

const busquedaClienteVenta = ref("");
const clientesFiltradosVenta = computed(() => {
  if (!busquedaClienteVenta.value.trim()) {
    return [];
  }

  const textoBusqueda = busquedaClienteVenta.value.toLowerCase();

  return clientes.value
    .filter((cliente) => {
      const texto = `
        ${cliente.nombre || ""}
        ${cliente.apellido || ""}
        ${cliente.dni || ""}
        ${cliente.telefono || ""}
      `.toLowerCase();

      return texto.includes(textoBusqueda);
    })
    .slice(0, 5);
});

const seleccionarClienteVenta = (cliente) => {
  nuevaVenta.value.clienteId = cliente.id;
  busquedaClienteVenta.value = `${cliente.nombre || ""} ${cliente.apellido || ""}`.trim();
};

const guardarVenta = async () => {
  try {
    if (!validarVenta()) return;

    nuevaVenta.value.productoCanje = usarCanje.value ? productoCanje.value : null;

    await api.post("/ventas", nuevaVenta.value);

    limpiarFormulario();
    await obtenerVentas();
    await obtenerProductos();

    mostrarFormulario.value = false;

  } catch (error) {
    console.error(error);
    errorMensaje.value = "Ocurrió un error al guardar la venta.";
  }
};

const eliminarProducto = (index) => {
  if (nuevaVenta.value.productos.length > 1) {
    nuevaVenta.value.productos.splice(index, 1);
    busquedasProductosVenta.value.splice(index, 1);
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
  const totalPagosNormales = nuevaVenta.value.pagos.reduce((total, pago) => {
    return total + Number(pago.monto || 0);
  }, 0);

  const totalCanje = usarCanje.value
    ? Number(productoCanje.value.valorTomadoPesos || 0)
    : 0;

  return totalPagosNormales + totalCanje;
});

const diferenciaPago = computed(() => {
  return totalProductos.value - totalPagos.value;
});

const formatearPesos = (valor) => {
  return new Intl.NumberFormat("es-AR").format(valor);
};

const mostrarFormulario = ref(false);
const cotizacionActual = ref(null);

const obtenerCotizacionActual = async () => {
  try {
    const response = await api.get("/cotizaciones/actual");

    cotizacionActual.value = response.data.valorUsdt;

    nuevaVenta.value.cotizacionDolar = response.data.valorUsdt;

    nuevaVenta.value.pagos.forEach((pago) => {
      pago.cotizacionUsada = response.data.valorUsdt;
    });

  } catch (error) {
    console.error("Error al obtener cotización", error);
  }
};

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

const formatearMetodoPago = (metodoPago) => {
  switch (metodoPago) {
    case "EFECTIVO":
      return "Efectivo";
    case "TRANSFERENCIA":
      return "Transferencia";
    case "USDT":
      return "USDT";
    case "TARJETA_CREDITO":
      return "Tarjeta crédito";
    case "PLAN_CANJE":
      return "Plan canje";
    default:
      return "";
  }
};

const generarComprobantePDF = (venta) => {

  const doc = new jsPDF();

  let y = 20;

  doc.setFontSize(20);
  doc.text("IMPORT TDF", 105, y, { align: "center" });

  y += 10;

  doc.setFontSize(14);
  doc.text("Comprobante de Venta", 105, y, { align: "center" });

  y += 20;

  doc.setFontSize(11);

  doc.text(`Fecha: ${venta.fecha}`, 14, y);
  y += 8;

  doc.text(
    `Cliente: ${venta.cliente?.nombre} ${venta.cliente?.apellido}`,
    14,
    y
  );

  y += 8;

  doc.text(
    `Vendedor: ${venta.vendedor?.nombre || ""}`,
    14,
    y
  );

  y += 15;

  doc.line(14, y, 196, y);

  y += 10;

  doc.setFontSize(13);
  doc.text("Productos", 14, y);

  y += 10;

  venta.detalles.forEach((detalle) => {

    const producto = detalle.producto;

    let nombreProducto =
      `${producto.nombre} ${producto.modelo}`;

    if (producto.varianteProducto) {

      nombreProducto += ` ${formatearVariante(
        producto.varianteProducto
      )}`;

    }

    if (producto.capacidad) {

      nombreProducto += ` ${producto.capacidad}`;

    }

    if (producto.color) {

      nombreProducto += ` ${producto.color}`;

    }

    doc.setFontSize(10);

    doc.text(nombreProducto, 18, y);

    y += 6;

    if (producto.condicionBateria) {

      doc.text(
        `Batería: ${producto.condicionBateria}%`,
        22,
        y
      );

      y += 6;

    }

    doc.text(
      `Precio: $${formatearPesos(
        detalle.precioVentaPesos
      )}`,
      22,
      y
    );

    y += 10;

  });

  if (venta.productosCanje?.length) {

  doc.line(14, y, 196, y);

  y += 12;

  doc.setFontSize(13);
  doc.text("Equipo recibido en canje", 14, y);

  y += 10;

  venta.productosCanje.forEach((canje) => {

    const producto = canje.productoRecibido;

    let nombreProducto =
      `${producto.nombre} ${producto.modelo}`;

    if (producto.varianteProducto) {

      nombreProducto += ` ${formatearVariante(
        producto.varianteProducto
      )}`;

    }

    if (producto.capacidad) {

      nombreProducto += ` ${producto.capacidad}`;

    }

    if (producto.color) {

      nombreProducto += ` ${producto.color}`;

    }

    doc.setFontSize(10);

    doc.text(nombreProducto, 18, y);

    y += 6;

    if (producto.condicionBateria) {

      doc.text(
        `Batería: ${producto.condicionBateria}%`,
        22,
        y
      );

      y += 6;

    }

    doc.text(
      `Valor tomado: $${formatearPesos(
        canje.valorTomadoPesos
      )}`,
      22,
      y
    );

    y += 10;

  });

}

  doc.line(14, y, 196, y);

  y += 12;

  doc.setFontSize(13);
  doc.text("Pagos", 14, y);

  y += 10;

  venta.pagos.forEach((pago) => {

    doc.setFontSize(10);

    doc.text(
      `${formatearMetodoPago(pago.metodoPago)} - ${pago.moneda}`,
      18,
      y
    );

    doc.text(
      `$${formatearPesos(pago.monto)}`,
      180,
      y,
      { align: "right" }
    );

    y += 8;

  });

  y += 5;

  doc.line(14, y, 196, y);

  y += 15;

  doc.setFontSize(13);

  doc.text(
    `TOTAL: $${formatearPesos(
      venta.totalVentaPesos
    )}`,
    14,
    y
  );

  y += 10;

  if (venta.observacion) {

    doc.setFontSize(10);

    doc.text(
      `Observación: ${venta.observacion}`,
      14,
      y
    );

    y += 10;

  }

  doc.setFontSize(11);

  doc.text(
    "Gracias por confiar en Import TDF",
    105,
    y + 15,
    { align: "center" }
  );

  doc.save(
    `venta-${venta.id}.pdf`
  );

};

const busqueda = ref("");
const fechaDesde = ref("");
const fechaHasta = ref("");
const filtroVendedor = ref("TODOS");
const filtroMetodoPago = ref("TODOS");

const ventasFiltradas = computed(() => {
  return ventas.value.filter((venta) => {
    const texto = `
      ${venta.cliente?.nombre || ""}
      ${venta.cliente?.apellido || ""}
      ${venta.vendedor?.nombre || ""}
      ${venta.observacion || ""}
    `.toLowerCase();

    const coincideBusqueda = texto.includes(busqueda.value.toLowerCase());

    const coincideVendedor =
      filtroVendedor.value === "TODOS" ||
      venta.vendedor?.id === filtroVendedor.value;

    const coincideMetodoPago =
      filtroMetodoPago.value === "TODOS" ||
      venta.pagos?.some((pago) => pago.metodoPago === filtroMetodoPago.value);

    const coincideFechaDesde =
      !fechaDesde.value || venta.fecha >= fechaDesde.value;

    const coincideFechaHasta =
      !fechaHasta.value || venta.fecha <= fechaHasta.value;

    return (
      coincideBusqueda &&
      coincideVendedor &&
      coincideMetodoPago &&
      coincideFechaDesde &&
      coincideFechaHasta
    );
  });
});

const resetearFiltros = () => {
  busqueda.value = "";
  fechaDesde.value = "";
  fechaHasta.value = "";
  filtroVendedor.value = "TODOS";
  filtroMetodoPago.value = "TODOS";
};

const formatearTipoAccesorio = (tipoAccesorio) => {
  switch (tipoAccesorio) {
    case "FUNDA":
      return "Funda";
    case "CARGADOR":
      return "Cargador";
    case "CABLE":
      return "Cable";
    case "AURICULAR":
      return "Auricular";
    default:
      return "Accesorio";
  }
};

const nombreProductoCompleto = (producto) => {
  const nombreBase =
    producto.categoria === "ACCESORIO"
      ? formatearTipoAccesorio(producto.tipoAccesorio)
      : producto.nombre;

  return [
    nombreBase,
    producto.modelo,
    formatearVariante(producto.varianteProducto),
    producto.capacidad,
    producto.color,
    producto.condicionBateria ? `Batería ${producto.condicionBateria}%` : null
  ]
    .filter((valor) => valor !== null && valor !== undefined && valor !== "")
    .join(" ");
};

const ventaDetalle = ref(null);

const abrirDetalleVenta = (venta) => {
  ventaDetalle.value = venta;
};

const cerrarDetalleVenta = () => {
  ventaDetalle.value = null;
};

const busquedasProductosVenta = ref([""]);

const normalizarTexto = (texto) => {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const productosFiltradosVenta = (index) => {
  const textoBusqueda = normalizarTexto(busquedasProductosVenta.value[index]);

  if (!textoBusqueda) return [];

  const palabrasBusqueda = textoBusqueda.split(" ");

  const productosUnicos = Array.from(
    new Map(productos.value.map((producto) => [producto.id, producto])).values()
  );

  return productosUnicos
    .filter((producto) => {
      if (producto.stock <= 0) return false;

      const textoProducto = normalizarTexto(`
        ${producto.nombre || ""}
        ${producto.categoria || ""}
        ${producto.modelo || ""}
        ${formatearVariante(producto.varianteProducto) || ""}
        ${producto.capacidad || ""}
        ${producto.color || ""}
        ${producto.tipoAccesorio || ""}
      `);

      return palabrasBusqueda.every((palabra) =>
        textoProducto.includes(palabra)
      );
    })
    .slice(0, 10);
};

const seleccionarProductoVenta = (producto, index) => {
  nuevaVenta.value.productos[index].productoId = producto.id;
  nuevaVenta.value.productos[index].precioVentaPesos = producto.precioVentaPesos;

  busquedasProductosVenta.value[index] =
    `${nombreProductoCompleto(producto)} - Stock: ${producto.stock}`;
};

onMounted(() => {
  obtenerVentas();
  obtenerClientes();
  obtenerVendedores();
  obtenerProductos();
  obtenerCotizacionActual();
});
</script>

<template>
  <div class="space-y-8 w-full max-w-7xl mx-auto">

    <div>
      <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Ventas</h1>
      <p class="text-gray-500 mt-1">Registrá ventas, pagos, canjes y consultá el historial.</p>
    </div>

    <div class="flex items-center justify-between gap-4">

  <div class="flex gap-3">

        <input
          v-model="busqueda"
          type="text"
          placeholder="Buscar venta..."
          class="border border-zinc-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
        />

        <input
          v-model="fechaDesde"
          type="date"
          class="border border-zinc-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
        />

        <input
          v-model="fechaHasta"
          type="date"
          class="border border-zinc-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
        />

        <select
          v-model="filtroVendedor"
          class="border border-zinc-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
        >
          <option value="TODOS">
            Todos los vendedores
          </option>

          <option
            v-for="vendedor in vendedores"
            :key="vendedor.id"
            :value="vendedor.id"
          >
            {{ vendedor.nombre }} {{ vendedor.apellido }}
          </option>
        </select>

        <select
          v-model="filtroMetodoPago"
          class="border border-zinc-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
        >
          <option value="TODOS">
            Todos los métodos
          </option>

          <option value="EFECTIVO">Efectivo</option>
          <option value="TRANSFERENCIA">Transferencia</option>
          <option value="USDT">USDT</option>
          <option value="TARJETA_CREDITO">Tarjeta crédito</option>
          <option value="PLAN_CANJE">Plan canje</option>
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
        {{ mostrarFormulario ? "Cancelar" : "+ Nueva venta" }}
      </button>

    </div>

    <div
      v-if="errorMensaje"
      class="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700 font-medium"
    >
      {{ errorMensaje }}
    </div>

    <section
      v-if="mostrarFormulario"
      class="bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
    >
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

          <div class="relative">
              <label class="label">Cliente</label>

              <input
                v-model="busquedaClienteVenta"
                type="text"
                placeholder="Buscar cliente por nombre o DNI"
                class="input"
              />

              <div
                v-if="clientesFiltradosVenta.length > 0"
                class="absolute z-20 mt-2 w-full bg-white border border-zinc-200 rounded-2xl shadow-lg overflow-hidden"
              >
                <button
                  v-for="cliente in clientesFiltradosVenta"
                  :key="cliente.id"
                  type="button"
                  @click="seleccionarClienteVenta(cliente)"
                  class="w-full text-left px-4 py-3 hover:bg-zinc-100 transition"
                >
                  <p class="font-semibold text-zinc-900">
                    {{ cliente.nombre }} {{ cliente.apellido }}
                  </p>

                  <p class="text-sm text-zinc-500">
                    DNI: {{ cliente.dni || "Sin DNI" }} · Tel: {{ cliente.telefono || "Sin teléfono" }}
                  </p>
                </button>
              </div>
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
            <input v-model.number="nuevaVenta.cotizacionDolar" type="number" step="0.01" class="input" placeholder="Cotización"/>
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

              <div class="relative">
                  <input
                    v-model="busquedasProductosVenta[index]"
                    type="text"
                    placeholder="Buscar producto..."
                    class="input bg-white"
                  />

                  <div
                    v-if="productosFiltradosVenta(index).length > 0"
                    class="absolute z-20 mt-2 w-full bg-white border border-zinc-200 rounded-2xl shadow-lg overflow-hidden max-h-72 overflow-y-auto"
                  >
                    <button
                      v-for="producto in productosFiltradosVenta(index)"
                      :key="`${index}-${producto.id}`"
                      type="button"
                      @click="seleccionarProductoVenta(producto, index)"
                      class="w-full text-left px-4 py-3 hover:bg-zinc-100 transition"
                    >
                      <p class="font-semibold text-zinc-900">
                        {{ nombreProductoCompleto(producto) }}
                      </p>

                      <p class="text-sm text-zinc-500">
                        Stock: {{ producto.stock }} · Venta: ${{ formatearPesos(producto.precioVentaPesos) }}
                      </p>
                    </button>
                  </div>
                </div>

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

            <input v-model.number="pago.cotizacionUsada" type="number" step="0.01" placeholder="Cotización" class="input bg-white" />

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
            <select
            v-if="productoCanje.categoria === 'IPHONE'"
            v-model="productoCanje.varianteProducto"
            class="input bg-white"
          >
            <option :value="null">Seleccionar variante</option>
            <option value="NORMAL">Normal</option>
            <option value="PLUS">Plus</option>
            <option value="PRO">Pro</option>
            <option value="PRO_MAX">Pro Max</option>
          </select>
            <input v-model="productoCanje.capacidad" type="text" placeholder="Capacidad" class="input bg-white" />
            <input v-model="productoCanje.color" type="text" placeholder="Color" class="input bg-white" />
            <input
              v-if="productoCanje.categoria === 'IPHONE'"
              v-model.number="productoCanje.condicionBateria"
              type="number"
              min="0"
              max="100"
              placeholder="Batería (%)"
              class="input bg-white"
            />

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
            <th class="th">Acciones</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="venta in ventasFiltradas" :key="venta.id" class="border-b border-gray-100 hover:bg-gray-50">
            <td class="td">{{ venta.fecha }}</td>
            <td class="td font-semibold">{{ venta.cliente?.nombre }} {{ venta.cliente?.apellido }}</td>
            <td class="td">{{ venta.vendedor?.nombre }}</td>

            <td class="td">
              <div v-for="pago in venta.pagos" :key="pago.id" class="text-sm">
                {{ formatearMetodoPago(pago.metodoPago) }} - ${{ pago.monto }}
              </div>
            </td>

            <td class="td font-bold">${{ venta.totalVentaPesos }}</td>
            <td class="td font-bold text-green-600">${{ venta.gananciaTotalPesos }}</td>
            <td class="td text-gray-500">{{ venta.observacion }}</td>
            <td class="td">
              <button
                type="button"
                @click="abrirDetalleVenta(venta)"
                class="border border-zinc-200 rounded-xl px-4 py-2 font-semibold hover:bg-zinc-100 transition"
              >
                Ver
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <div
  v-if="ventaDetalle"
  class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
>
  <div class="bg-white rounded-3xl shadow-xl w-full max-w-3xl p-8">

          <div class="flex items-start justify-between mb-6">

        <div>
          <h2 class="text-2xl font-bold text-zinc-900">
            Detalle de venta
          </h2>

          <p class="text-sm text-zinc-500 mt-1">
            {{ ventaDetalle.fecha }}
          </p>
        </div>

        <div class="flex gap-3">
          <button
            type="button"
            @click="generarComprobantePDF(ventaDetalle)"
            class="bg-black text-white rounded-xl px-4 py-2 font-bold hover:bg-zinc-800 transition"
          >
            Generar PDF
          </button>

          <button
            type="button"
            @click="cerrarDetalleVenta"
            class="border border-zinc-200 rounded-xl px-4 py-2 font-bold hover:bg-zinc-100 transition"
          >
            Cerrar
          </button>
        </div>

      </div>

      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="rounded-2xl bg-zinc-50 border border-zinc-200 p-4">
          <p class="text-sm text-zinc-500">Cliente</p>
          <h3 class="font-bold text-zinc-900 mt-1">
            {{ ventaDetalle.cliente?.nombre }} {{ ventaDetalle.cliente?.apellido }}
          </h3>
        </div>

        <div class="rounded-2xl bg-zinc-50 border border-zinc-200 p-4">
          <p class="text-sm text-zinc-500">Vendedor</p>
          <h3 class="font-bold text-zinc-900 mt-1">
            {{ ventaDetalle.vendedor?.nombre }}
          </h3>
        </div>

        <div class="rounded-2xl bg-zinc-50 border border-zinc-200 p-4">
          <p class="text-sm text-zinc-500">Total venta</p>
          <h3 class="font-bold text-zinc-900 mt-1">
            ${{ formatearPesos(ventaDetalle.totalVentaPesos) }}
          </h3>
        </div>

        <div class="rounded-2xl bg-zinc-50 border border-zinc-200 p-4">
          <p class="text-sm text-zinc-500">Ganancia</p>
          <h3 class="font-bold text-green-600 mt-1">
            ${{ formatearPesos(ventaDetalle.gananciaTotalPesos) }}
          </h3>
        </div>
      </div>

      <div class="mb-6">
        <h3 class="font-bold text-zinc-900 mb-3">
          Productos vendidos
        </h3>

        <div class="space-y-2">
          <div
            v-for="detalle in ventaDetalle.detalles"
            :key="detalle.id"
            class="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3"
          >
            <div class="flex justify-between gap-4">
              <div>
                <p class="font-bold text-zinc-900">
                  {{ detalle.producto?.nombre }}
                  {{ detalle.producto?.modelo }}
                  {{ formatearVariante(detalle.producto?.varianteProducto) }}
                </p>

                <p class="text-sm text-zinc-500">
                  {{ detalle.producto?.capacidad }}
                  · {{ detalle.producto?.color }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="ventaDetalle.productosCanje?.length"
        class="mb-6"
      >
        <h3 class="font-bold text-zinc-900 mb-3">
          Plan canje
        </h3>

        <div
          v-for="canje in ventaDetalle.productosCanje"
          :key="canje.id"
          class="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3"
        >
          <div class="flex justify-between gap-4">
            <div>
              <p class="font-bold text-zinc-900">
                {{ canje.productoRecibido?.nombre }}
                {{ canje.productoRecibido?.modelo }}
                {{ formatearVariante(canje.productoRecibido?.varianteProducto) }}
              </p>

              <p class="text-sm text-zinc-500">
                {{ canje.productoRecibido?.capacidad }}
                · {{ canje.productoRecibido?.color }}

                <span v-if="canje.productoRecibido?.condicionBateria">
                  · 🔋 {{ canje.productoRecibido?.condicionBateria }}%
                </span>
              </p>
            </div>

            <div class="text-right">
              <p class="text-sm text-zinc-500">
                Valor tomado
              </p>

              <p class="font-bold text-zinc-900">
                ${{ formatearPesos(canje.valorTomadoPesos) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="mb-6">
        <h3 class="font-bold text-zinc-900 mb-3">
          Pagos
        </h3>

        <div class="space-y-2">
          <div
            v-for="pago in ventaDetalle.pagos"
            :key="pago.id"
            class="flex justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3"
          >
            <span class="font-semibold text-zinc-800">
              {{ formatearMetodoPago(pago.metodoPago) }} / {{ pago.moneda }}
            </span>

            <span class="font-bold">
              ${{ formatearPesos(pago.monto) }}
            </span>
          </div>
        </div>
      </div>

      <div>
        <h3 class="font-bold text-zinc-900 mb-3">
          Observación
        </h3>

        <div class="rounded-2xl bg-zinc-50 border border-zinc-200 p-4 text-zinc-600">
          {{ ventaDetalle.observacion || "Sin observación" }}
        </div>
      </div>

    </div>
  </div>

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