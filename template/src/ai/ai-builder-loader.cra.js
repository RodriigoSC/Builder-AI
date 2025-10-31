// src/ai/ai-builder-loader.cra.js
import React from 'react';

export function loadAIPagesCRA() {
  // require.context procura recursivamente em src/pages
  const context = require.context('../pages', true, /\.jsx$/);
  const keys = context.keys(); // ex: ['./Login.jsx', './auth/Index.jsx']

  const pages = keys.map((key) => {
    // transformações: './Login.jsx' -> '/login'
    let route = key
      .replace(/^\.\//, '')        // remove ./ inicial
      .replace(/\/index\.jsx$/, '')// index.jsx vira raiz do diretório
      .replace(/\.jsx$/, '')       // remove extensão
      .toLowerCase();

    route = route === '' || route === 'home' ? '/' : `/${route}`;
    const Component = React.lazy(context.bind(null, key));
    return { path: route, component: Component };
  });

  return pages;
}
