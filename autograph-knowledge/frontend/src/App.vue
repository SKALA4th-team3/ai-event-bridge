<template>
  <header class="topbar">
    <div class="topbar-inner">
      <span class="brand-mark">공</span>
      <div class="brand-copy"><strong>나라행사</strong><small>정부 행사/축제 입찰 플랫폼</small></div>
      <nav class="top-navigation" aria-label="주요 메뉴">
        <router-link to="/events/101">성과 분석</router-link>
        <router-link to="/admin/knowledge">AI Knowledge 관리</router-link>
      </nav>
    </div>
  </header>
  <router-view />
</template>

<style scoped>
.brand-copy{min-width:max-content}.top-navigation{display:flex;align-items:center;gap:4px;margin-left:auto}.top-navigation a{padding:9px 12px;border-radius:7px;color:#59667a;font-size:13px;text-decoration:none}.top-navigation a:hover{background:#f3f6fa;color:#234f8d}.top-navigation a.router-link-active{background:#eaf2fd;color:#1e55a0;font-weight:700}@media(max-width:620px){.top-navigation{gap:0}.top-navigation a{padding:8px;font-size:11px}.brand-copy small{display:none}}
</style>
