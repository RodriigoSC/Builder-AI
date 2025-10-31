// src/ai/ai-builder-loader.vite.js
/**
 * Loader para bundlers que suportam import.meta.glob (Vite, Snowpack)
 * Retorna array de { path, component: React.lazy(...) }
 */
import { lazy } from 'react';

export function loadAIPagesVite() {
  // Ajuste o pattern para jsx/tsx conforme necessário
  const modules = import.meta.glob('../pages/**/*.{js,jsx,ts,tsx}', { eager: false });

  const pages = Object.keys(modules).map((rawPath) => {
    // rawPath exemplo: ../pages/Login.jsx
    const clean = rawPath
      .replace('../pages', '')
      .replace(/\/index\.(js|jsx|ts|tsx)$/, '') // Remove /index.jsx, /index.tsx, etc.
      .replace(/\.(js|jsx|ts|tsx)$/, '')     // Remove a extensão .jsx, .tsx, etc.
      .toLowerCase();

    const route = clean === '' || clean === '/home' ? '/' : clean;
    // componente lazy (dinâmico)
    const component = lazy(() => modules[rawPath]());
    return { path: route, component };
  });

  return pages;
}
