// --- i18n language switching logic ---
function updateLanguage(lang) {
  if (typeof translations === 'undefined') return;
  // Update text content
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
}

document.addEventListener('DOMContentLoaded', function() {
  const langSelector = document.getElementById('language-selector');
  if (!langSelector) return;
  const lang = localStorage.getItem('selectedLang') || langSelector.value || 'en-US';
  langSelector.value = lang;
  updateLanguage(lang);
  langSelector.addEventListener('change', function() {
    const newLang = this.value;
    localStorage.setItem('selectedLang', newLang);
    updateLanguage(newLang);
  });
});
const global = {
  currentPage: window.location.pathname,
  search: {
    term: "",
    type: "",
    page: 1,
    totalPages: 1,
  },
  api: {
    apiKey: "05f6448275e5ecbda8a0f27deced5b4e",
    apiUrl: "https://api.themoviedb.org/3",
  },
};

// Add global language variable and selector event
if (!global.language) {
  global.language = localStorage.getItem("flixx-language") || "en-US";
// ...existing code...

document.addEventListener("DOMContentLoaded", function () {
  const langSelector = document.getElementById("language-selector");
  if (langSelector) {
    langSelector.value = global.language;
    langSelector.addEventListener("change", function () {
      global.language = langSelector.value;
      localStorage.setItem("flixx-language", global.language);
      window.location.reload();
    });
  }
});

// Display 20 most popular movies
async function displayPopularMovies() {
  const data = await fetchAPIData("movie/popular");
  hideSpinner();
  if (!data || !data.results) {
    console.error("No movie data returned from API");
    return;
  }
  const container = document.getElementById("popular-movies");
  if (!container) return;
  data.results.forEach((movie) => {
    const div = document.createElement("div");
    div.classList.add("card");
    div.innerHTML = `
      <div class="card">
        <a href="movie-details.html?id=${movie.id}">
          ${
            movie.poster_path
              ? `<img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" class="card-img-top" alt="${movie.title}" />`
              : `<img src="images/no-image.jpg" class="card-img-top" alt="${movie.title}" />`
          }
        </a>
        <div class="card-body">
          <h5 class="card-title">${movie.title}</h5>
          <p class="card-text">
            <small class="text-muted">Release: ${movie.release_date}</small>
          </p>
        </div>
      </div>
    `;
    container.appendChild(div);
  });
}

// Display 20 most popular tv shows
async function displayPopularTVShows() {
  const data = await fetchAPIData("tv/popular");
  hideSpinner();
  if (!data || !data.results) {
    console.error("No TV show data returned from API");
    return;
  }
  data.results.forEach((show) => {
    const div = document.createElement("div");
    div.classList.add("card");
    div.innerHTML = `
    <div class="card">
          <a href="tv-details.html?id=${show.id}">
            ${
              show.poster_path
                ? `<img
              src="https://image.tmdb.org/t/p/w500${show.poster_path}"
              class="card-img-top"
              alt="${show.name}"
            /> `
                : `<img
              src="images/no-image.jpg"
              class="card-img-top"
              alt="${show.name}"
            />`
            }
          </a>
          <div class="card-body">
            <h5 class="card-title">${show.name}</h5>
            <p class="card-text">
              <small class="text-muted">Release: ${show.first_air_date}</small>
            </p>
          </div>
        </div>
        `;
    document.getElementById("popular-shows").appendChild(div);
  });
}

async function displayMovieDetails() {
  // Get movie id from query string
  const params = new URLSearchParams(window.location.search);
  let movieId = params.get("id");
  // If no id is present and current page is movie.html, use a default for testing
  if (!movieId && global.currentPage.endsWith("movie.html")) {
    movieId = "550"; // Fight Club as example
    window.history.replaceState(
      null,
      "",
      window.location.pathname + "?id=" + movieId
    );
  }
  if (!movieId) {
    console.error("No movie id found in URL");
    return;
  }

  const movie = await fetchAPIData(`movie/${movieId}`);
  hideSpinner();

  const container = document.getElementById("movie-details");
  if (!container) return;

  if (!movie) {
    const errorDiv = document.createElement("div");
    errorDiv.innerHTML =
      '<p class="text-danger">Movie not found or API error.</p>';
    container.appendChild(errorDiv);
    return;
  }

  // Overlay for background image
  displayBackgroundImage("movie", movie.backdrop_path);

  // Fetch cast
  let castHtml = '';
  try {
    const credits = await fetchAPIData(`movie/${movieId}/credits`);
    if (credits && credits.cast && credits.cast.length > 0) {
      const topCast = credits.cast.slice(0, 8);
      castHtml = `<h4>Actors & Actresses</h4><div class="list-group">${topCast.map(person => `<span>${person.name}</span>`).join(', ')}</div>`;
    }
  } catch (e) { /* ignore cast errors */ }
  // Fetch trailer
  const trailerHtml = await getTrailerHtml('movie', movieId);
  // Get current language
  const lang = localStorage.getItem('selectedLang') || 'en-US';
  // Helper for translation
  const t = (key) => (translations[lang] && translations[lang][key]) ? translations[lang][key] : key;
  const watchOnlineBtn = `<div style="margin:20px 0;text-align:center;"><a href="https://vidsrc.icu/embed/movie/${movieId}" target="_blank" class="btn" style="background:var(--color-secondary);color:#000;font-weight:700;">Watch Online</a></div>`;
  const div = document.createElement("div");
  div.innerHTML = `
    <div class="details-top">
      <div>
        <img
          src="${
            movie.poster_path
              ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
              : "images/no-image.jpg"
          }"
          class="card-img-top"
          alt="${movie.title}"
        />
      </div>
      <div>
        <h2>${movie.title}</h2>
        <p>
          <i class="fas fa-star text-primary"></i>
          ${movie.vote_average.toFixed(1)} / 10
        </p>
        <p class="text-muted">${t('release_date')}: ${movie.release_date}</p>
        <p>${movie.overview}</p>
        <!-- genres removed -->
        <a href="${
          movie.homepage
        }" target="_blank" class="btn">${t('visit_homepage')}</a>
      </div>
    </div>
    ${trailerHtml}
    ${watchOnlineBtn}
    <div class="details-bottom">
      <h2>${t('movie_info')}</h2>
      <ul>
        <li><span class="text-secondary">${t('budget')}:</span> ${addCommasToNumber(
          movie.budget
        )}</li>
        <li><span class="text-secondary">${t('revenue')}:</span> ${addCommasToNumber(
          movie.revenue
        )}</li>
        <li><span class="text-secondary">${t('runtime')}:</span> ${movie.runtime}</li>
        <li><span class="text-secondary">${t('status')}:</span> ${movie.status}</li>
      </ul>
      <h4>${t('production_companies')}</h4>
      <div class="list-group">${movie.production_companies
        .map((company) => `<span>${company.name}</span>`)
        .join(", ")}</div>
      ${castHtml ? `<h4>${t('actors')}</h4>${castHtml.split('</h4>')[1]}` : ''}
    </div>
  `;
  container.appendChild(div);
}

async function displayMoviesDetailsPage() {
  const params = new URLSearchParams(window.location.search);
  const movieId = params.get("id");
  if (!movieId) {
    console.error("No movie id found in URL");
    return;
  }
  const movie = await fetchAPIData(`movie/${movieId}`);
  hideSpinner();
  if (!movie) {
    const errorDiv = document.createElement("div");
    errorDiv.innerHTML =
      '<p class="text-danger">Movie not found or API error.</p>';
    document.getElementById("movie-details").appendChild(errorDiv);
    return;
  }
  displayBackgroundImage("movie", movie.backdrop_path);
  const div = document.createElement("div");
  div.innerHTML = `
    <div class="details-top">
      <div>
        <img
          src="${
            movie.poster_path
              ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
              : "images/no-image.jpg"
          }"
          class="card-img-top"
          alt="${movie.title}"
        />
      </div>
      <div>
        <h2>${movie.title}</h2>
        <p>
          <i class="fas fa-star text-primary"></i>
          ${movie.vote_average.toFixed(1)} / 10
        </p>
        <p class="text-muted">Release Date: ${movie.release_date}</p>
        <p>${movie.overview}</p>
  <!-- genres removed -->
        <a href="${
          movie.homepage
        }" target="_blank" class="btn">Visit Movie Homepage</a>
      </div>
    </div>
    <div class="details-bottom">
      <h2>Movie Info</h2>
      <ul>
        <li><span class="text-secondary">Budget:</span> ${addCommasToNumber(
          movie.budget
        )}</li>
        <li><span class="text-secondary">Revenue:</span> ${addCommasToNumber(
          movie.revenue
        )}</li>
        <li><span class="text-secondary">Runtime:</span> ${movie.runtime}</li>
        <li><span class="text-secondary">Status:</span> ${movie.status}</li>
      </ul>
      <h4>Production Companies</h4>
      <div class="list-group">${movie.production_companies
        .map((company) => `<span>${company.name}</span>`)
        .join(", ")}</div>
    </div>
  `;
  const movieDetailsContainer = document.getElementById("movie-details");
  if (movieDetailsContainer) {
    movieDetailsContainer.appendChild(div);
  }
}

// Display show details
async function displayShowDetails() {
  // Get show id from query string
  const params = new URLSearchParams(window.location.search);
  const showId = params.get("id");
  if (!showId) {
    console.error("No show id found in URL");
    return;
  }
  const show = await fetchAPIData(`tv/${showId}`);
  hideSpinner();
  if (!show) {
    const errorDiv = document.createElement("div");
    errorDiv.innerHTML =
      '<p class="text-danger">Show not found or API error.</p>';
    document.getElementById("show-details").appendChild(errorDiv);
    return;
  }

  // Overlay for background image
  displayBackgroundImage("show", show.backdrop_path);

  // Fetch cast and presenters
  let castHtml = '';
  try {
    const credits = await fetchAPIData(`tv/${showId}/credits`);
    if (credits) {
      // Actors & Actresses
      if (credits.cast && credits.cast.length > 0) {
        const topCast = credits.cast.slice(0, 8);
        castHtml += `<h4>TV Presenters</h4><div class="list-group">${topCast.map(person => `<span>${person.name}</span>`).join(', ')}</div>`;
      }
      // Presenters
      if (credits.crew && credits.crew.length > 0) {
        const presenters = credits.crew.filter(person => person.job && person.job.toLowerCase() === 'presenter');
        if (presenters.length > 0) {
          castHtml += `<h4>Presenters</h4><div class="list-group">${presenters.map(person => `<span>${person.name}</span>`).join(', ')}</div>`;
        }
      }
    }
  } catch (e) { /* ignore cast errors */ }
  // Fetch trailer
  const trailerHtml = await getTrailerHtml('tv', showId);
  // Watch Online button for TV shows (use season 1, episode 1 as default)
  const watchOnlineBtn = `<div style="margin:20px 0;text-align:center;"><a href="https://vidsrc.icu/embed/tv/${showId}/1/1" target="_blank" class="btn" style="background:var(--color-secondary);color:#000;font-weight:700;">Watch Online</a></div>`;
  const div = document.createElement("div");
  div.innerHTML = `
  <div class="details-top">
          <div>
            <img
              src="${
                show.poster_path
                  ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
                  : "images/no-image.jpg"
              }"
              class="card-img-top"
              alt="${show.name}"
            />
          </div>
          <div>
            <h2>${show.name}</h2>
            <p>
              <i class="fas fa-star text-primary"></i>
              ${show.vote_average.toFixed(1)} / 10
            </p>
            <p class="text-muted">Last Air date: ${show.last_air_date}</p>
            <p>${show.overview}</p>
                <!-- genres removed -->
            <a href="${
              show.homepage
            }" target="_blank" class="btn">Visit Show Homepage</a>
          </div>
        </div>
        ${trailerHtml}
        ${watchOnlineBtn}
        <div class="details-bottom">
          <h2>Show Info</h2>
          <ul>
            <li><span class="text-secondary">Number Of Episodes:</span> ${addCommasToNumber(
              show.number_of_episodes
            )}</li>
            <li><span class="text-secondary">Last Episode To Air:</span> ${
              show.last_episode_to_air.name
            }</li>
            <li><span class="text-secondary">Status:</span> ${show.status}</li>
          </ul>
          <h4>Production Companies</h4>
          <div class="list-group">${show.production_companies
            .map((company) => `<span>${company.name}</span>`)
            .join(", ")}</div>
          ${castHtml}
        </div>
  `;
  const showDetailsContainer = document.getElementById("show-details");
  if (showDetailsContainer) {
    showDetailsContainer.appendChild(div);
  }
}

// Display backdrop on details pages
function displayBackgroundImage(type, backdropPath) {
  const overlayDiv = document.createElement("div");
  overlayDiv.style.backgroundImage = `url(https://image.tmdb.org/t/p/original${backdropPath})`;
  overlayDiv.style.backgroundSize = "cover";
  overlayDiv.style.backgroundPosition = "center";
  overlayDiv.style.backgroundRepeat = "no-repeat";
  overlayDiv.style.height = "100vh";
  overlayDiv.style.width = "100vw";
  overlayDiv.style.position = "absolute";
  overlayDiv.style.top = "0";
  overlayDiv.style.left = "0";
  overlayDiv.style.zIndex = "-1";
  overlayDiv.style.opacity = "0.2";

  if (type === "movie") {
    // Support overlay for searched-movie-details page
    let container = document.getElementById("movie-details");
    if (!container) {
      container = document.getElementById("searched-movie-overlay");
    }
    if (container) container.appendChild(overlayDiv);
  } else {
    const container = document.getElementById("show-details");
    if (container) container.appendChild(overlayDiv);
  }
}

// Search movies/shows
async function search() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);

  // Get selected type from radio buttons by id
  let type = "movie";
  if (document.getElementById("tv") && document.getElementById("tv").checked) {
    type = "tv";
  }
  global.search.type = type;
  global.search.term = urlParams.get("search-term");

  if (global.search.term && global.search.term.trim() !== "") {
    const { results, total_pages, page } = await searchMovies();

    if (!results || results.length === 0) {
      showAlert("No results found");
      return;
    }

    global.search.totalPages = total_pages;
    global.search.page = page;
    displaySearchResults(results);
    renderPagination(global.search.page, global.search.totalPages);

    document.querySelector("#search-term").value = "";
  } else {
    showAlert("Please enter a search term");
  }
}

// Only one definition of displaySearchResults
function displaySearchResults(results) {
  const searchResultsContainer = document.getElementById("search-results");
  if (!searchResultsContainer) {
    console.warn("Search results container not found");
    return;
  }
  // Clear previous results
  searchResultsContainer.innerHTML = "";
  // Remove previous pagination if exists
  const oldPagination = document.getElementById("search-pagination");
  if (oldPagination) oldPagination.remove();

  // Add heading with page info
  const heading = document.createElement("h2");
  heading.className = "search-heading";
  heading.style.margin = "20px 0";
  heading.style.textAlign = "center";
  heading.style.fontWeight = "700";
  heading.style.fontSize = "2rem";
  heading.innerHTML = `Search Results <span style='font-size:1rem;font-weight:400;'>(Page ${global.search.page} of ${global.search.totalPages})</span>`;
  searchResultsContainer.appendChild(heading);
  results.forEach((result) => {
    const div = document.createElement("div");
    div.classList.add("card");
    div.innerHTML = `
      <div class="card">
        <a href="${
          global.search.type === "movie"
            ? `searched-movie-details.html?id=${result.id}`
            : `searched-tv-details.html?id=${result.id}`
        }" class="search-result-link">
          ${
            result.poster_path
              ? `<img
                  src="https://image.tmdb.org/t/p/w500${result.poster_path}"
                  class="card-img-top"
                  alt="${
                    global.search.type === "movie" ? result.title : result.name
                  }"
                /> `
              : `<img
                  src="images/no-image.jpg"
                  class="card-img-top"
                  alt="${
                    global.search.type === "movie" ? result.title : result.name
                  }"
                />`
          }
        </a>
        <div class="card-body">
          <h5 class="card-title">${
            global.search.type === "movie" ? result.title : result.name
          }</h5>
          <p class="card-text">
            <small class="text-muted">Release: ${
              global.search.type === "movie"
                ? result.release_date
                : result.first_air_date
            }</small>
          </p>
        </div>
      </div>
    `;
    searchResultsContainer.appendChild(div);
  });
}

// Move renderPagination and searchWithPage outside of displaySearchResults
function renderPagination(currentPage, totalPages) {
  const searchResultsContainer = document.getElementById("search-results");
  if (!searchResultsContainer) return;
  if (totalPages <= 1) return;
  const paginationDiv = document.createElement("div");
  paginationDiv.id = "search-pagination";
  paginationDiv.className = "pagination";
  paginationDiv.style.margin = "20px 0";
  paginationDiv.style.display = "flex";
  paginationDiv.style.justifyContent = "center";
  paginationDiv.style.gap = "10px";
  paginationDiv.style.background = "#f8f9fa";
  paginationDiv.style.padding = "10px";
  paginationDiv.style.borderRadius = "8px";

  // Previous button
  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Previous";
  prevBtn.disabled = currentPage <= 1;
  prevBtn.className = "btn";
  prevBtn.style.fontWeight = "bold";
  prevBtn.style.padding = "8px 16px";
  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      global.search.page = currentPage - 1;
      searchWithPage();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
  paginationDiv.appendChild(prevBtn);

  // Page info
  const pageInfo = document.createElement("span");
  pageInfo.textContent = ` Page ${currentPage} of ${totalPages} `;
  pageInfo.style.alignSelf = "center";
  pageInfo.style.fontWeight = "bold";
  paginationDiv.appendChild(pageInfo);

  // Next button
  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  nextBtn.disabled = currentPage >= totalPages;
  nextBtn.className = "btn";
  nextBtn.style.fontWeight = "bold";
  nextBtn.style.padding = "8px 16px";
  nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      global.search.page = currentPage + 1;
      searchWithPage();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
  paginationDiv.appendChild(nextBtn);

  searchResultsContainer.parentNode.insertBefore(
    paginationDiv,
    searchResultsContainer.nextSibling
  );
}

async function searchWithPage() {
  showSpinner();
  const API_KEY = global.api.apiKey;
  const API_URL = global.api.apiUrl;
  const language = global.language || "en-US";
  try {
    const response = await fetch(
      `${API_URL}/search/${
        global.search.type
      }?api_key=${API_KEY}&language=${language}&query=${encodeURIComponent(
        global.search.term
      )}&page=${global.search.page}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    if (!text) {
      throw new Error("Empty response from API");
    }
    const { results, total_pages, page } = JSON.parse(text);
    hideSpinner();
    global.search.totalPages = total_pages;
    global.search.page = page;
    displaySearchResults(results);
    renderPagination(global.search.page, global.search.totalPages);
  } catch (error) {
    hideSpinner();
    showAlert("API fetch error: " + error.message);
  }
}

// Display Slider Movies
async function displaySlider() {
  const { results } = await fetchAPIData("movie/now_playing");

  results.forEach((movie) => {
    const div = document.createElement("div");
    div.classList.add("swiper-slide");

    div.innerHTML = `
            <a href="movie-details.html?id=${movie.id}">
              <img src="${
                movie.poster_path
                  ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                  : "./images/no-image.jpg"
              }" alt="${movie.title}" />
            </a>
            <h4 class="swiper-rating">
              <i class="fas fa-star text-secondary"></i> ${movie.vote_average.toFixed(
                1
              )} / 10
            </h4>
    `;
    document.querySelector(".swiper-wrapper").appendChild(div);

    initSwiper();
  });
}

function initSwiper() {
  const swiper = new Swiper(".swiper", {
    slidesPerView: 1,
    spaceBetween: 30,
    freeMode: true,
    loop: true,
    autoplay: {
      delay: 4000,
      disableOnInteraction: false,
    },
    breakpoints: {
      500: {
        slidesPerView: 2,
      },
      700: {
        slidesPerView: 3,
      },
      1200: {
        slidesPerView: 4,
      },
    },
  });
}

// fetch data from TMDB API
async function fetchAPIData(endpoint) {
  const API_KEY = global.api.apiKey;
  const API_URL = global.api.apiUrl;
  const language = global.language || "en-US";
  showSpinner();
  try {
    const url = `${API_URL}/${endpoint}?api_key=${API_KEY}&language=${language}`;
    console.log(`[DEBUG] fetchAPIData called with endpoint:`, endpoint, 'Full URL:', url);
    const response = await fetch(url);
    if (!response.ok) {
      console.error("[DEBUG] API fetch error: ", response.status, 'for endpoint:', endpoint);
      return null;
    }
    const text = await response.text();
    if (!text) {
      console.error("[DEBUG] Empty response from API for endpoint:", endpoint);
      return null;
    }
    const parsed = JSON.parse(text);
    console.log(`[DEBUG] fetchAPIData response for endpoint:`, endpoint, parsed);
    return parsed;
  } catch (error) {
    console.error("[DEBUG] API fetch error:", error, 'for endpoint:', endpoint);
    return null;
  } finally {
    hideSpinner();
  }
}

// Make search request
async function searchMovies() {
  const API_KEY = global.api.apiKey;
  const API_URL = global.api.apiUrl;

  showSpinner();
  try {
    const response = await fetch(
      `${API_URL}/search/${
        global.search.type
      }?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(
        global.search.term
      )}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    if (!text) {
      throw new Error("Empty response from API");
    }
    return JSON.parse(text);
  } catch (error) {
    console.error("API fetch error:", error);
    return null;
  } finally {
    hideSpinner();
  }
}

function showSpinner() {
  const spinner = document.getElementById("spinner");
  if (spinner) {
    spinner.classList.add("show");
  }
}

function hideSpinner() {
  const spinner = document.getElementById("spinner");
  if (spinner) {
    spinner.classList.remove("show");
  }
}

// Highlight active link
function highlightActiveLink() {
  const links = document.querySelectorAll(".nav-link");
  // Get current file name
  const currentFile = global.currentPage.split("/").pop() || "index.html";
  links.forEach((link) => {
    let href = link.getAttribute("href");
    // Remove leading slash if present
    if (href.startsWith("/")) {
      href = href.slice(1);
    }
    // Also handle case where href is just '/' (home)
    if (
      (currentFile === "index.html" &&
        (href === "index.html" || href === "")) ||
      href === currentFile
    ) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

// Show Alert
function showAlert(message, className = "error") {
  const alertContainer = document.querySelector("#alert");
  if (!alertContainer) {
    console.warn("Alert container not found");
    return;
  }
  alertContainer.innerHTML = "";
  const alertEl = document.createElement("div");
  alertEl.classList.add("alert", className);
  alertEl.style.display = "block";
  alertEl.style.margin = "10px 0";
  alertEl.appendChild(document.createTextNode(message));
  alertContainer.appendChild(alertEl);

  setTimeout(() => {
    alertEl.remove();
  }, 3000);
}

// Fetch trailer video and return embedded iframe HTML or empty string
async function getTrailerHtml(type, id) {
  const API_KEY = global.api.apiKey;
  const API_URL = global.api.apiUrl;
  try {
    const response = await fetch(
      `${API_URL}/${type}/${id}/videos?api_key=${API_KEY}&language=${global.language || 'en-US'}`
    );
    if (!response.ok) {
      console.error("Failed to fetch trailer videos:", response.status);
      return "";
    }
    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      return "";
    }
    // Find a trailer video from YouTube
    const trailer = data.results.find(
      (video) =>
        video.type === "Trailer" &&
        video.site === "YouTube" &&
        video.key
    );
    if (!trailer) {
      return "";
    }
    // Return iframe HTML embedding the YouTube trailer
    return `
      <div class="trailer-container" style="margin: 20px 0; text-align: center;">
        <h4>Trailer</h4>
        <iframe
          width="560"
          height="315"
          src="https://www.youtube.com/embed/${trailer.key}"
          title="YouTube video player"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
    `;
  } catch (error) {
    console.error("Error fetching trailer videos:", error);
    return "";
  }
}

function addCommasToNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Display details for searched TV show on searched-tv-details.html
async function displaySearchedTVDetails() {
  const params = new URLSearchParams(window.location.search);
  const showId = params.get("id");
  if (!showId) {
    console.error("No TV show id found in URL");
    return;
  }
  const show = await fetchAPIData(`tv/${showId}`);
  hideSpinner();
  const detailsContainer = document.getElementById("show-details");
  if (!detailsContainer) return;
  if (!show) {
    const errorDiv = document.createElement("div");
    errorDiv.innerHTML =
      '<p class="text-danger">TV Show not found or API error.</p>';
    detailsContainer.appendChild(errorDiv);
    return;
  }
  displayBackgroundImage("show", show.backdrop_path);
  // Fetch cast and presenters
  let castHtml = '';
  try {
    const credits = await fetchAPIData(`tv/${showId}/credits`);
    if (credits) {
      // Actors & Actresses
      if (credits.cast && credits.cast.length > 0) {
        const topCast = credits.cast.slice(0, 8);
        castHtml += `<h4>TV Presenters</h4><div class="list-group">${topCast.map(person => `<span>${person.name}</span>`).join(', ')}</div>`;
      }
      // Presenters
      if (credits.crew && credits.crew.length > 0) {
        const presenters = credits.crew.filter(person => person.job && person.job.toLowerCase() === 'presenter');
        if (presenters.length > 0) {
          castHtml += `<h4>Presenters</h4><div class="list-group">${presenters.map(person => `<span>${person.name}</span>`).join(', ')}</div>`;
        }
      }
    }
  } catch (e) { /* ignore cast errors */ }
  // Fetch trailer
  const trailerHtml = await getTrailerHtml('tv', showId);
  // Watch Online button for TV shows (use season 1, episode 1 as default)
  const watchOnlineBtn = `<div style="margin:20px 0;text-align:center;"><a href="https://vidsrc.icu/embed/tv/${showId}/1/1" target="_blank" class="btn" style="background:var(--color-secondary);color:#000;font-weight:700;">Watch Online</a></div>`;
  const div = document.createElement("div");
  div.innerHTML = `
    <div class="details-top">
      <div>
        <img
          src="${
            show.poster_path
              ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
              : "images/no-image.jpg"
          }"
          class="card-img-top"
          alt="${show.name}"
        />
      </div>
      <div>
        <h2>${show.name}</h2>
        <p>
          <i class="fas fa-star text-primary"></i>
          ${show.vote_average.toFixed(1)} / 10
        </p>
        <p class="text-muted">Last Air date: ${show.last_air_date}</p>
        <p>${show.overview}</p>
  <!-- genres removed -->
        <a href="${
          show.homepage
        }" target="_blank" class="btn">Visit Show Homepage</a>
      </div>
    </div>
    ${trailerHtml}
    ${watchOnlineBtn}
    <div class="details-bottom">
      <h2>Show Info</h2>
      <ul>
        <li><span class="text-secondary">Number Of Episodes:</span> ${addCommasToNumber(
          show.number_of_episodes
        )}</li>
        <li><span class="text-secondary">Last Episode To Air:</span> ${
          show.last_episode_to_air && show.last_episode_to_air.name ? show.last_episode_to_air.name : 'N/A'
        }</li>
        <li><span class="text-secondary">Status:</span> ${show.status}</li>
      </ul>
      <h4>Production Companies</h4>
      <div class="list-group">${show.production_companies
        .map((company) => `<span>${company.name}</span>`)
        .join(", ")}</div>
      ${castHtml}
    </div>
  `;
  detailsContainer.appendChild(div);
}

// Display details for searched movie on searched-movie-details.html
async function displaySearchedMovieDetails() {
  const params = new URLSearchParams(window.location.search);
  let movieId = params.get("id");
  // If no id is present, use a default for testing (e.g., Fight Club)
  if (!movieId) {
    movieId = "550";
    window.history.replaceState(null, "", window.location.pathname + "?id=" + movieId);
  }
  console.log("[DEBUG] displaySearchedMovieDetails called with movieId:", movieId);
  const movie = await fetchAPIData(`movie/${movieId}`);
  console.log("[DEBUG] Movie data fetched:", movie);
  hideSpinner();
  const detailsContainer = document.getElementById("movie-details");
  if (!detailsContainer) {
    console.error("[DEBUG] #movie-details container not found");
    return;
  }
  if (!movie) {
    console.error("[DEBUG] No movie data returned for id:", movieId);
    const errorDiv = document.createElement("div");
    errorDiv.innerHTML =
      '<p class="text-danger">Movie not found or API error.</p>';
    detailsContainer.appendChild(errorDiv);
    return;
  }
  displayBackgroundImage("movie", movie.backdrop_path);
  // Fetch cast
  let castHtml = '';
  try {
    const credits = await fetchAPIData(`movie/${movieId}/credits`);
    console.log("[DEBUG] Movie credits fetched:", credits);
    if (credits && credits.cast && credits.cast.length > 0) {
      const topCast = credits.cast.slice(0, 8);
      castHtml = `<h4>Actors & Actresses</h4><div class="list-group">${topCast.map(person => `<span>${person.name}</span>`).join(', ')}</div>`;
    }
  } catch (e) {
    console.error("[DEBUG] Error fetching cast:", e);
  }
  // Fetch trailer
  const trailerHtml = await getTrailerHtml('movie', movieId);
  // Watch Online button
  const watchOnlineBtn = `<div style="margin:20px 0;text-align:center;"><a href="https://vidsrc.icu/embed/movie/${movieId}" target="_blank" class="btn" style="background:var(--color-secondary);color:#000;font-weight:700;">Watch Online</a></div>`;
  const div = document.createElement("div");
  div.innerHTML = `
    <div class="details-top">
      <div>
        <img
          src="${
            movie.poster_path
              ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
              : "images/no-image.jpg"
          }"
          class="card-img-top"
          alt="${movie.title}"
        />
      </div>
      <div>
        <h2>${movie.title}</h2>
        <p>
          <i class="fas fa-star text-primary"></i>
          ${movie.vote_average.toFixed(1)} / 10
        </p>
        <p class="text-muted">Release Date: ${movie.release_date}</p>
        <p>${movie.overview}</p>
  <!-- genres removed -->
        <a href="${
          movie.homepage
        }" target="_blank" class="btn">Visit Movie Homepage</a>
      </div>
    </div>
    ${trailerHtml}
    ${watchOnlineBtn}
    <div class="details-bottom">
      <h2>Movie Info</h2>
      <ul>
        <li><span class="text-secondary">Budget:</span> ${addCommasToNumber(
          movie.budget
        )}</li>
        <li><span class="text-secondary">Revenue:</span> ${addCommasToNumber(
          movie.revenue
        )}</li>
        <li><span class="text-secondary">Runtime:</span> ${movie.runtime}</li>
        <li><span class="text-secondary">Status:</span> ${movie.status}</li>
      </ul>
      <h4>Production Companies</h4>
      <div class="list-group">${movie.production_companies
        .map((company) => `<span>${company.name}</span>`)
        .join(", ")}</div>
      ${castHtml}
    </div>
  `;
  detailsContainer.appendChild(div);
}

// Init App

async function init() {
  console.log("init() function called");
  const page = global.currentPage;
  console.log("global.currentPage:", `"${page}"`);
  console.log("page.endsWith('searched-movie-details.html'):", page.endsWith('searched-movie-details.html'));
  if (page === '/' || page.endsWith('index.html')) {
    await displaySlider();
    await displayPopularMovies();
  } else if (page.endsWith('shows.html')) {
    await displayPopularTVShows();
  } else if (page.endsWith('movie-details.html')) {
    await displaySearchedMovieDetails();
  } else if (page.endsWith('tv-details.html')) {
    await displayShowDetails();
  } else if (page.endsWith('search.html')) {
    await search();
  } else if (page.endsWith('searched-tv-details.html')) {
    await displaySearchedTVDetails();
  } else if (page.endsWith('searched-movie-details.html')) {
    console.log("Calling displaySearchedMovieDetails()");
    await displaySearchedMovieDetails();
  } else {
    console.log("No matching page found for init()");
  }
  highlightActiveLink();
}

// ...existing code...
document.addEventListener('DOMContentLoaded', () => {
  // Show disclaimer modal on page load
  showDisclaimerModal();
  init();
});

function showDisclaimerModal() {
  // Prevent duplicate modals
  if (document.getElementById('disclaimer-modal')) return;
  // Modal overlay
  const overlay = document.createElement('div');
  overlay.id = 'disclaimer-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.background = 'rgba(0,0,0,0.7)';
  overlay.style.zIndex = '9998';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';

  // Modal box
  const modal = document.createElement('div');
  modal.id = 'disclaimer-modal';
  modal.style.background = '#181c24';
  modal.style.color = '#fff';
  modal.style.padding = '32px 28px 24px 28px';
  modal.style.borderRadius = '18px';
  modal.style.boxShadow = '0 8px 32px rgba(0,0,0,0.35)';
  modal.style.maxWidth = '420px';
  modal.style.width = '90%';
  modal.style.position = 'relative';
  modal.style.textAlign = 'left';
  modal.style.fontSize = '1rem';
  modal.style.lineHeight = '1.6';
  modal.style.animation = 'disclaimerFadeIn 0.5s';

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  closeBtn.setAttribute('aria-label', 'Close disclaimer');
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '12px';
  closeBtn.style.right = '16px';
  closeBtn.style.background = 'transparent';
  closeBtn.style.border = 'none';
  closeBtn.style.color = '#fff';
  closeBtn.style.fontSize = '2rem';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.transition = 'color 0.2s';
  closeBtn.onmouseover = () => (closeBtn.style.color = '#f1c40f');
  closeBtn.onmouseout = () => (closeBtn.style.color = '#fff');
  closeBtn.onclick = () => {
    overlay.remove();
    document.body.style.overflow = '';
  };

  // Disclaimer content (text only, no logo)
  modal.innerHTML = `
    <h3 style="margin-top:0;font-size:1.4rem;display:flex;align-items:center;gap:8px;">📌 Disclaimer</h3>
    <p>
      At <strong>PandaStream</strong>, we do <em>not</em> host any of the videos or media content displayed on this website.
      All content is provided through third-party sources that are publicly available online, including:
      <a href="https://www.themoviedb.org/" target="_blank" style="color:#0bf;">TMDb</a> and
      <a href="https://vidsrc.icu/" target="_blank" style="color:#0bf;">VidSrc</a>.
    </p>
    <p>
      We do not assume any legal responsibility for the content of these external sources,
      nor do we claim ownership or distribution rights for any media shown on this site.
    </p>
    <p>
      If you are a content owner and believe your copyrighted material is being infringed,
      please contact us and we will promptly remove the offending content.
    </p>
    <p><strong>Note:</strong> By using this website, you agree to these terms and understand the nature of the content provided.</p>
  `;
  modal.appendChild(closeBtn);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  // Add fade-in animation via JS (since not in CSS file)
  const style = document.createElement('style');
  style.innerHTML = `@keyframes disclaimerFadeIn { from { opacity: 0; transform: scale(0.95);} to { opacity: 1; transform: scale(1);} }`;
  document.head.appendChild(style);
}
}

