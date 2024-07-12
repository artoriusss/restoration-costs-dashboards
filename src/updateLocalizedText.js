export const updateLocalizedText = (t) => {
    document.querySelectorAll('[data-key]').forEach(el => {
      const key = el.getAttribute('data-key');
      if (t[key]) {
        el.textContent = t[key];
      }
    });
};