import { createRouter, createWebHistory } from "vue-router";

import DashboardView from "../views/DashboardView.vue";
import ProductosView from "../views/ProductosView.vue";
import VentasView from "../views/VentasView.vue";
import ClientesView from "../views/ClientesView.vue";
import VendedoresView from "../views/VendedoresView.vue";
import GastosView from "../views/GastosView.vue";
import ReportesView from "../views/ReportesView.vue";

const routes = [
  {
    path: "/",
    component: DashboardView,
  },
  {
    path: "/productos",
    component: ProductosView,
  },
  {
    path: "/ventas",
    component: VentasView,
  },
  {
    path: "/clientes",
    component: ClientesView,
  },
  {
    path: "/vendedores",
    component: VendedoresView,
  },
  {
    path: "/gastos",
    component: GastosView,
  },
  {
    path: "/reportes",
    component: ReportesView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;