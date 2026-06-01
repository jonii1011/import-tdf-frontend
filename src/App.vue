<template>
  <div class="min-h-screen bg-[#f5f5f7]">

    <aside class="fixed left-0 top-0 h-screen w-65 bg-black text-white p-6 flex flex-col">
      <h1 class="text-2xl font-bold">IMPORT TDF</h1>
      <p class="text-sm text-gray-400 mt-1 mb-8">Sistema de gestión</p>

      <nav class="flex flex-col gap-2">
        <router-link class="nav-link" to="/">Dashboard</router-link>
        <router-link class="nav-link" to="/productos">Productos</router-link>
        <router-link class="nav-link" to="/ventas">Ventas</router-link>
        <router-link class="nav-link" to="/clientes">Clientes</router-link>
        <router-link class="nav-link" to="/vendedores">Vendedores</router-link>
        <router-link class="nav-link" to="/gastos">Gastos</router-link>
        <router-link class="nav-link" to="/reportes">Reportes</router-link>
      </nav>
    </aside>

    <main class="ml-65 p-10">
      <router-view />
    </main>

  </div>
</template>

<style scoped>
.nav-link {
  padding: 12px 16px;
  border-radius: 14px;
  color: white;
  text-decoration: none;
  transition: 0.2s;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
}

.router-link-active {
  background: rgba(255, 255, 255, 0.12);
}
</style>