// src/ai/ai-builder-preview.js
export function setupLivePreview() {
  // Para Vite / CRA com HMR:
  if (import.meta && import.meta.hot) {
    import.meta.hot.accept(() => {
      console.log('♻️ AI Builder: HMR - atualizando preview');
      // reload para garantir mount limpo do preview
      window.location.reload();
    });
  } else if (module && module.hot) {
    module.hot.accept(() => {
      console.log('♻️ AI Builder: Webpack HMR - atualizando preview');
      window.location.reload();
    });
  }
}
