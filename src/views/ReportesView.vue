<script setup>
import { onMounted, ref } from "vue";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../api/axios";

const reporteGeneral = ref(null);
const reportesVendedores = ref([]);
const exportandoPDF = ref(false);
const errorExportacion = ref("");

const tipoPeriodo = ref("MES");
const mesSeleccionado = ref("2026-06");

const formatearPesos = (valor) => {
  return new Intl.NumberFormat("es-AR").format(valor || 0);
};

const formatearMonedaPDF = (valor) => {
  return `$ ${new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(valor) || 0)}`;
};

const obtenerDescripcionPeriodo = () => {
  const hoy = new Date();

  if (tipoPeriodo.value === "DIA") {
    return hoy.toLocaleDateString("es-AR");
  }

  if (tipoPeriodo.value === "SEMANA") {
    const inicio = new Date(hoy);
    const dia = hoy.getDay() || 7;
    inicio.setDate(hoy.getDate() - dia + 1);

    const fin = new Date(inicio);
    fin.setDate(inicio.getDate() + 6);

    return `${inicio.toLocaleDateString("es-AR")} al ${fin.toLocaleDateString("es-AR")}`;
  }

  const [anio, mes] = mesSeleccionado.value.split("-");
  const fecha = new Date(Number(anio), Number(mes) - 1, 1);

  return fecha.toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });
};

const exportarReporteGeneralPDF = () => {
  if (!reporteGeneral.value || exportandoPDF.value) return;

  exportandoPDF.value = true;
  errorExportacion.value = "";

  try {
    const doc = new jsPDF();

    const periodo = obtenerDescripcionPeriodo();
    const fechaGeneracion = new Date().toLocaleString("es-AR");

    doc.setFillColor(24, 24, 27);
    doc.rect(0, 0, 210, 28, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("IMPORT TDF", 14, 12);

    doc.setFontSize(12);
    doc.text("Reporte general del negocio", 14, 21);

    doc.setTextColor(24, 24, 27);
    doc.setFontSize(11);

    doc.text(`Periodo: ${periodo}`, 14, 40);
    doc.text(`Generado: ${fechaGeneracion}`, 14, 48);

    autoTable(doc, {
      startY: 60,
      head: [["Concepto", "Valor"]],
      body: [
        ["Cantidad de ventas", reporteGeneral.value.cantidadVentas || 0],
        ["Ingresos totales", formatearMonedaPDF(reporteGeneral.value.ingresosTotales)],
        ["Ganancia bruta", formatearMonedaPDF(reporteGeneral.value.gananciaBruta)],
        ["Gastos totales", formatearMonedaPDF(reporteGeneral.value.gastosTotales)],
        ["Ganancia neta", formatearMonedaPDF(reporteGeneral.value.gananciaNeta)],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [24, 24, 27],
        textColor: [255, 255, 255],
      },
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
      columnStyles: {
        0: { fontStyle: "bold" },
        1: { halign: "right" },
      },
    });

    doc.setFontSize(9);
    doc.setTextColor(113, 113, 122);
    doc.text(
      "Reporte interno generado automáticamente por Import TDF.",
      105,
      285,
      { align: "center" }
    );

    const periodoArchivo =
      tipoPeriodo.value === "MES"
        ? mesSeleccionado.value
        : tipoPeriodo.value.toLowerCase();

    doc.save(`reporte-general-import-tdf-${periodoArchivo}.pdf`);

  } catch (error) {
    console.error("Error al exportar reporte general", error);
    errorExportacion.value = "No se pudo generar el PDF general.";
  } finally {
    exportandoPDF.value = false;
  }
};

const exportarPDF = (vendedorSeleccionado = null) => {
  if (!reporteGeneral.value || exportandoPDF.value) return;

  exportandoPDF.value = true;
  errorExportacion.value = "";

  try {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const anchoPagina = doc.internal.pageSize.getWidth();
    const periodo = obtenerDescripcionPeriodo();
    const fechaGeneracion = new Date().toLocaleString("es-AR");

    doc.setFillColor(24, 24, 27);
    doc.rect(0, 0, anchoPagina, 28, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("IMPORT TDF", 14, 12);

    doc.setFontSize(12);
    doc.text("Reporte financiero", 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Periodo: ${periodo}`, anchoPagina - 14, 12, { align: "right" });
    doc.text(`Generado: ${fechaGeneracion}`, anchoPagina - 14, 20, { align: "right" });

    const resumen = [
      ["Ventas", String(reporteGeneral.value.cantidadVentas || 0)],
      ["Ingresos", formatearMonedaPDF(reporteGeneral.value.ingresosTotales)],
      ["Ganancia bruta", formatearMonedaPDF(reporteGeneral.value.gananciaBruta)],
      ["Gastos", formatearMonedaPDF(reporteGeneral.value.gastosTotales)],
      ["Ganancia neta", formatearMonedaPDF(reporteGeneral.value.gananciaNeta)],
    ];

    const margen = 14;
    const separacion = 4;
    const anchoTarjeta = (anchoPagina - margen * 2 - separacion * 4) / 5;

    resumen.forEach(([titulo, valor], indice) => {
      const x = margen + indice * (anchoTarjeta + separacion);

      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(228, 228, 231);
      doc.roundedRect(x, 34, anchoTarjeta, 20, 2, 2, "FD");

      doc.setTextColor(113, 113, 122);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(titulo, x + 4, 41);

      doc.setTextColor(24, 24, 27);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(valor, x + 4, 49, { maxWidth: anchoTarjeta - 8 });
    });

    const filasVendedores = reportesVendedores.value.map((vendedor) => [
      vendedor.vendedorNombre,
      vendedor.cantidadVentas || 0,
      vendedor.productosVendidos || 0,
      formatearMonedaPDF(vendedor.ingresosTotales),
      formatearMonedaPDF(vendedor.gananciaBruta),
      formatearMonedaPDF(vendedor.gastosAsignados),
      formatearMonedaPDF(vendedor.gananciaNeta),
    ]);

    doc.setTextColor(24, 24, 27);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Resumen por vendedor", 14, 62);

    autoTable(doc, {
      startY: 66,
      head: [[
        "Vendedor",
        "Ventas",
        "Productos",
        "Ingresos",
        "Ganancia bruta",
        "Gastos",
        "Ganancia neta",
      ]],
      body: filasVendedores.length
        ? filasVendedores
        : [["Sin vendedores para el periodo seleccionado", "-", "-", "-", "-", "-", "-"]],
      margin: { top: 16, right: 14, bottom: 16, left: 14 },
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 3,
        lineColor: [228, 228, 231],
        lineWidth: 0.2,
        textColor: [63, 63, 70],
        valign: "middle",
      },
      headStyles: {
        fillColor: [24, 24, 27],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
      },
      bodyStyles: {
        halign: "right",
      },
      columnStyles: {
        0: { halign: "left", fontStyle: "bold", cellWidth: 45 },
        1: { halign: "center", cellWidth: 20 },
        2: { halign: "center", cellWidth: 22 },
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
    });

    const cantidadPaginasResumen = doc.getNumberOfPages();
    const vendedoresAExportar = vendedorSeleccionado
      ? [vendedorSeleccionado]
      : [];

    vendedoresAExportar.forEach((vendedor) => {
      doc.addPage("a4", "portrait");

      const anchoRecibo = doc.internal.pageSize.getWidth();
      const altoRecibo = doc.internal.pageSize.getHeight();

      doc.setFillColor(24, 24, 27);
      doc.rect(0, 0, anchoRecibo, 30, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("IMPORT TDF", 14, 13);
      doc.setFontSize(11);
      doc.text("Liquidacion individual por vendedor", 14, 22);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Periodo: ${periodo}`, anchoRecibo - 14, 13, { align: "right" });
      doc.text(`Comprobante Nro. ${vendedor.vendedorId}`, anchoRecibo - 14, 22, { align: "right" });

      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(228, 228, 231);
      doc.roundedRect(14, 38, anchoRecibo - 28, 32, 2, 2, "FD");

      doc.setTextColor(113, 113, 122);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("VENDEDOR", 20, 47);
      doc.text("PERIODO LIQUIDADO", 112, 47);
      doc.text("FECHA DE EMISION", 112, 61);

      doc.setTextColor(24, 24, 27);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(vendedor.vendedorNombre || "Sin nombre", 20, 56, { maxWidth: 82 });
      doc.setFontSize(10);
      doc.text(periodo, 112, 53, { maxWidth: 78 });
      doc.text(fechaGeneracion, 112, 67, { maxWidth: 78 });

      const indicadores = [
        ["Ventas realizadas", String(vendedor.cantidadVentas || 0)],
        ["Productos vendidos", String(vendedor.productosVendidos || 0)],
        ["Ingresos generados", formatearMonedaPDF(vendedor.ingresosTotales)],
      ];
      const anchoIndicador = (anchoRecibo - 36) / 3;

      indicadores.forEach(([titulo, valor], indice) => {
        const x = 14 + indice * (anchoIndicador + 4);

        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(228, 228, 231);
        doc.roundedRect(x, 78, anchoIndicador, 25, 2, 2, "D");
        doc.setTextColor(113, 113, 122);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(titulo, x + 4, 87);
        doc.setTextColor(24, 24, 27);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(valor, x + 4, 97, { maxWidth: anchoIndicador - 8 });
      });

      doc.setTextColor(24, 24, 27);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Detalle de la liquidacion", 14, 119);

      autoTable(doc, {
        startY: 125,
        head: [["Concepto", "Importe"]],
        body: [
          ["Ganancia bruta generada", formatearMonedaPDF(vendedor.gananciaBruta)],
          ["Gastos asignados", `- ${formatearMonedaPDF(vendedor.gastosAsignados)}`],
          ["Resultado neto", formatearMonedaPDF(vendedor.gananciaNeta)],
        ],
        margin: { right: 14, left: 14 },
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 10,
          cellPadding: 5,
          lineColor: [228, 228, 231],
          lineWidth: 0.2,
          textColor: [63, 63, 70],
        },
        headStyles: {
          fillColor: [24, 24, 27],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        columnStyles: {
          0: { halign: "left" },
          1: { halign: "right", fontStyle: "bold", cellWidth: 65 },
        },
        didParseCell: (data) => {
          if (data.section === "body" && data.row.index === 2) {
            data.cell.styles.fillColor = [244, 244, 245];
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.textColor = [24, 24, 27];
          }
        },
      });

      doc.setTextColor(113, 113, 122);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);

      doc.setDrawColor(161, 161, 170);
      doc.line(22, altoRecibo - 42, 86, altoRecibo - 42);
      doc.line(anchoRecibo - 86, altoRecibo - 42, anchoRecibo - 22, altoRecibo - 42);
      doc.setTextColor(113, 113, 122);
      doc.setFontSize(8);
      doc.text("Responsable", 54, altoRecibo - 36, { align: "center" });
      doc.text("Vendedor", anchoRecibo - 54, altoRecibo - 36, { align: "center" });
    });

    if (vendedorSeleccionado) {
      for (let pagina = 0; pagina < cantidadPaginasResumen; pagina += 1) {
        doc.deletePage(1);
      }
    }

    const cantidadPaginas = doc.getNumberOfPages();

    for (let pagina = 1; pagina <= cantidadPaginas; pagina += 1) {
      doc.setPage(pagina);
      doc.setTextColor(113, 113, 122);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const anchoPaginaActual = doc.internal.pageSize.getWidth();
      doc.text(
        `Import TDF - Pagina ${pagina} de ${cantidadPaginas}`,
        anchoPaginaActual / 2,
        doc.internal.pageSize.getHeight() - 7,
        { align: "center" }
      );
    }

    const periodoArchivo = tipoPeriodo.value === "MES"
      ? mesSeleccionado.value
      : tipoPeriodo.value.toLowerCase();

    if (vendedorSeleccionado) {
      const nombreArchivo = (vendedorSeleccionado.vendedorNombre || "vendedor")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();

      doc.save(`liquidacion-${nombreArchivo}-${periodoArchivo}.pdf`);
    } else {
      doc.save(`liquidacion-vendedores-import-tdf-${periodoArchivo}.pdf`);
    }
  } catch (error) {
    console.error("Error al exportar el reporte", error);
    errorExportacion.value = "No se pudo generar el PDF. Intentá nuevamente.";
  } finally {
    exportandoPDF.value = false;
  }
};

const obtenerParametros = () => {
  let url = `tipo=${tipoPeriodo.value}`;

  if (tipoPeriodo.value === "MES") {
    const [anio, mes] = mesSeleccionado.value.split("-");
    url += `&mes=${mes}&anio=${anio}`;
  }

  return url;
};

const obtenerReportes = async () => {
  try {
    const params = obtenerParametros();

    const responseGeneral = await api.get(`/reportes/general?${params}`);
    const responseVendedores = await api.get(`/reportes/vendedores?${params}`);

    reporteGeneral.value = responseGeneral.data;
    reportesVendedores.value = responseVendedores.data;

  } catch (error) {
    console.error("Error al obtener reportes", error);
  }
};

const cambiarPeriodo = async (tipo) => {
  tipoPeriodo.value = tipo;
  await obtenerReportes();
};

onMounted(() => {
  obtenerReportes();
});
</script>

<template>
  <div class="space-y-8 w-full max-w-7xl mx-auto">

    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-zinc-900 tracking-tight">
          Reportes
        </h1>

        <p class="text-zinc-500 mt-1">
          Resumen financiero y rendimiento por vendedor.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="exportarReporteGeneralPDF"
          :disabled="!reporteGeneral || exportandoPDF"
          class="px-5 py-3 rounded-2xl bg-black text-white font-semibold shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {{ exportandoPDF ? "Generando..." : "Exportar reporte general" }}
        </button>

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

          <input
            v-if="tipoPeriodo === 'MES'"
            v-model="mesSeleccionado"
            @change="obtenerReportes"
            type="month"
            class="border border-zinc-200 rounded-2xl px-4 py-2 outline-none focus:ring-2 focus:ring-black"
          />
        </div>
      </div>
    </div>

    <p
      v-if="errorExportacion"
      class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
    >
      {{ errorExportacion }}
    </p>

    <div
      v-if="reporteGeneral"
      class="grid grid-cols-1 md:grid-cols-5 gap-5"
    >
      <div class="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6">
        <p class="text-zinc-500 text-sm">Ventas</p>
        <h2 class="text-3xl font-bold mt-2 text-zinc-900">
          {{ reporteGeneral.cantidadVentas }}
        </h2>
      </div>

      <div class="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6">
        <p class="text-zinc-500 text-sm">Ingresos</p>
        <h2 class="text-2xl font-bold mt-2 text-zinc-900">
          ${{ formatearPesos(reporteGeneral.ingresosTotales) }}
        </h2>
      </div>

      <div class="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6">
        <p class="text-zinc-500 text-sm">Ganancia bruta</p>
        <h2 class="text-2xl font-bold mt-2 text-green-600">
          ${{ formatearPesos(reporteGeneral.gananciaBruta) }}
        </h2>
      </div>

      <div class="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6">
        <p class="text-zinc-500 text-sm">Gastos</p>
        <h2 class="text-2xl font-bold mt-2 text-red-600">
          ${{ formatearPesos(reporteGeneral.gastosTotales) }}
        </h2>
      </div>

      <div class="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6">
        <p class="text-zinc-500 text-sm">Ganancia neta</p>
        <h2 class="text-2xl font-bold mt-2 text-zinc-900">
          ${{ formatearPesos(reporteGeneral.gananciaNeta) }}
        </h2>
      </div>
    </div>

    <section class="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
      <div class="p-6 border-b border-zinc-100">
        <h2 class="text-2xl font-bold text-zinc-900">
          Reporte por vendedor
        </h2>

        <p class="text-sm text-zinc-500 mt-1">
          Resumen tipo recibo mensual por cada vendedor.
        </p>
      </div>

      <table class="w-full text-center">
        <thead class="bg-zinc-50 border-b border-zinc-100">
          <tr>
            <th class="p-4 text-sm font-semibold text-zinc-600">Vendedor</th>
            <th class="p-4 text-sm font-semibold text-zinc-600">Ventas</th>
            <th class="p-4 text-sm font-semibold text-zinc-600">Productos</th>
            <th class="p-4 text-sm font-semibold text-zinc-600">Ingresos</th>
            <th class="p-4 text-sm font-semibold text-zinc-600">Ganancia bruta</th>
            <th class="p-4 text-sm font-semibold text-zinc-600">Gastos</th>
            <th class="p-4 text-sm font-semibold text-zinc-600">Ganancia neta</th>
            <th class="p-4 text-sm font-semibold text-zinc-600">PDF</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="vendedor in reportesVendedores"
            :key="vendedor.vendedorId"
            class="border-b border-zinc-100 hover:bg-zinc-50 transition"
          >
            <td class="p-4 font-bold text-zinc-900">
              {{ vendedor.vendedorNombre }}
            </td>

            <td class="p-4 text-zinc-700">
              {{ vendedor.cantidadVentas }}
            </td>

            <td class="p-4 text-zinc-700">
              {{ vendedor.productosVendidos }}
            </td>

            <td class="p-4 text-zinc-700">
              ${{ formatearPesos(vendedor.ingresosTotales) }}
            </td>

            <td class="p-4 font-semibold text-green-600">
              ${{ formatearPesos(vendedor.gananciaBruta) }}
            </td>

            <td class="p-4 font-semibold text-red-600">
              ${{ formatearPesos(vendedor.gastosAsignados) }}
            </td>

            <td class="p-4 font-bold text-zinc-900">
              ${{ formatearPesos(vendedor.gananciaNeta) }}
            </td>

            <td class="p-4">
              <button
                @click="exportarPDF(vendedor)"
                :disabled="exportandoPDF"
                class="whitespace-nowrap rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:border-black hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Exportar PDF
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

  </div>
</template>
