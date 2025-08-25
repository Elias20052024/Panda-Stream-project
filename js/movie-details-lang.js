// movie-details-lang.js
// Handles language switching and dynamic translation for movie-details.html

document.addEventListener('DOMContentLoaded', function() {
  const langSelector = document.getElementById('language-selector');
  if (!langSelector) return;
  const lang = localStorage.getItem('selectedLang') || langSelector.value || 'en-US';
  langSelector.value = lang;
  updateMovieDetailsLanguage(lang);
  langSelector.addEventListener('change', function() {
    const newLang = this.value;
    localStorage.setItem('selectedLang', newLang);
    updateMovieDetailsLanguage(newLang);
  });
});

function updateMovieDetailsLanguage(lang) {
  // Update static elements with data-i18n
  if (typeof translations === 'undefined') return;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });
  // Update alt attributes
  document.querySelectorAll('[data-i18n-alt]').forEach(el => {
    const key = el.getAttribute('data-i18n-alt');
    if (translations[lang] && translations[lang][key]) {
      el.alt = translations[lang][key];
    }
  });
  // Update placeholders
  const searchInput = document.getElementById('search-term');
  if (searchInput && translations[lang] && translations[lang].search_placeholder) {
    searchInput.placeholder = translations[lang].search_placeholder;
  }
  // Re-render dynamic movie details if present
  if (typeof rerenderMovieDetails === 'function') {
    rerenderMovieDetails(lang);
  }
}
