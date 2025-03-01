const apikey = "e950e51d5d49e85f7c2f17f01eb23ba3";
const apiEndpoint = "https://api.themoviedb.org/3"
const imgPath = "https://image.tmdb.org/t/p/original";


const apiPaths = {
    fetchAllCategories: `${apiEndpoint}/genre/movie/list?api_key=${apikey}`,
    fetchMoviesList: (id) => `${apiEndpoint}/discover/movie?api_key=${apikey}&with_genres=${id}`,
    fetchTrending:`${apiEndpoint}/trending/all/day?api_key=${apikey}&language=en-US`,

}


// Boots up the app
function init() {
    fetchTrendingMovies();
    fetchAndBuildAllSections();
}

function fetchTrendingMovies(){
    fetchAndbuildMovieSection(apiPaths.fetchTrending, 'Trending Now')
    .then(list => {
        const randomIndex = parseInt(Math.random() * list.length);
        buildBannerSection(list[randomIndex]);
    }).catch(err=>{
        console.error(err);
    });
}




function fetchAndBuildAllSections(){
    fetch(apiPaths.fetchAllCategories)
    .then(res => res.json())
    .then(res => {
        const categories = res.genres;
        if (Array.isArray(categories) && categories.length) {
            categories.forEach(category => {
                fetchAndbuildMovieSection(
                    apiPaths.fetchMoviesList(category.id),
                    category.name
                );
            });
        }
        // console.table(movies);
    })
    .catch(err=>console.error(err));
}

function fetchAndbuildMovieSection(fetchUrl, categoryName){
    console.log(fetchUrl,categoryName);
    return fetch(fetchUrl)
    .then(res => res.json())
    .then(res => {
        // console.table(res.results);
        const movies = res.results;
        if (Array.isArray(movies) && movies.length) {
            buildMoviesSection(movies.slice(0,6), categoryName);
        }
        return movies;
    })
    .catch(err=>console.error(err))
}

function buildMoviesSection(list, categoryName){
    console.log(list, categoryName);

    const moviesCont = document.getElementById('movies-cont');

    const moviesListHTML = list.map(item => {
        return `
        <div class="movie-item" onmouseenter="searchMovieTrailer('${item.title}', 'yt${item.id}')">
            <img decoding="async" class="move-item-img" src="${imgPath}${item.backdrop_path}" alt="${item.title}" />
            <div class="iframe-wrap" id="yt${item.id}"></div>
        </div>`;
    }).join('');

    const moviesSectionHTML = `
        <h2 class="movie-section-heading">${categoryName} <span class="explore-nudge">Explore All</span></span></h2>
        <div class="movies-row">
            ${moviesListHTML}
        </div>
    `

    const div = document.createElement('div');
    div.className = "movies-section"
    div.innerHTML = moviesSectionHTML;

    // append html into movies container
    moviesCont.append(div);
}

function searchMovieTrailer(movieName, iframId) {
    if (!movieName) return;

    fetch(apiPaths.searchOnYoutube(movieName))
    .then(res => res.json())
    .then(res => {
        const bestResult = res.items[0];

        const elements = document.getElementById(iframId);
        console.log(elements, iframId);

        const div = document.createElement('div');
        div.innerHTML = `<iframe width="245px" height="150px"  src="https://www.youtube.com/embed/${bestResult.id.videoId}?autoplay=1&controls=0"></iframe>`
// window.open(youtubeUrl,'_blank');
        elements.append(div);

    })
    .catch(err=>console.log(err));
}


window.addEventListener('load',function() {
    init();
    window.addEventListener('scroll', function(){
        // header ui update
        const header = document.getElementById('header');
        if (window.scrollY > 5) header.classList.add('black-bg')
        else header.classList.remove('black-bg');
    })
})

let search = document.querySelector(".search"); 

search.onclick = function() {
  document.querySelector(".search-container").classList.toggle("active");
}

async function fetchMovies(endpoint, page=1) {
    try {
      const url = `${TMDB_BASE_URL}${endpoint}?api_key=${TMDB_API_KEY}&language=en-US&page=${page}`;
      const res = await fetch(url);
      const data = await res.json();
      return data.results || [];
    } catch(e) {
      console.error("Error fetching:", e);
      return [];
    }
  }
  async function loadNowPlaying() {
    const movies = await fetchMovies("/movie/now_playing", nowPlayingPage);
    renderMovies(movies, "nowPlayingGrid");
  }
  async function loadComingSoon() {
    const movies = await fetchMovies("/movie/upcoming", comingSoonPage);
    renderMovies(movies, "comingSoonGrid");
  }
  async function loadTVShows() {
    const shows = await fetchMovies("/tv/popular", tvShowsPage);
    renderMovies(shows, "tvShowsGrid");
  }
  async function loadAnime() {
    const animes = await fetchMovies("/discover/tv?with_genres=16", animePage);
    if (animes.length===0 && animePage===1) {
      document.getElementById("animeFallback").style.display="block";
    } else {
      document.getElementById("animeFallback").style.display="none";
    }
    renderMovies(animes, "animeGrid");
  }
  function renderMovies(items, containerId) {
    const container = document.getElementById(containerId);
    items.forEach(item => {
      const div = document.createElement("div");
      div.className = "movie-item";
      const title = item.title || item.name;
      div.onclick = () => openMovieModal(item.id, title, (containerId==="tvShowsGrid"||containerId==="animeGrid"));
      div.innerHTML = `
        <img src="${IMG_BASE_URL + (item.poster_path||'')}" alt="${title}"/>
        <div class="movie-title">${title}</div>
      `;
      container.appendChild(div);
    });
  }
  function loadMore(category) {
    if (category==="nowPlaying") {
      nowPlayingPage++; loadNowPlaying();
    } else if (category==="comingSoon") {
      comingSoonPage++; loadComingSoon();
    } else if (category==="tvShows") {
      tvShowsPage++; loadTVShows();
    } else if (category==="anime") {
      animePage++; loadAnime();
    }
  }

  /* ========== SEARCH ========== */
  async function searchMovies(query) {
    try {
      const url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      const data = await res.json();
      return data.results || [];
    } catch(e) {
      console.error("Search error:", e);
      return [];
    }
  }
  async function handleSearch() {
    const query = document.getElementById("movieSearch").value.trim();
    const container = document.getElementById("nowPlayingGrid");
    if (query.length>2) {
      container.innerHTML = "";
      const results = await searchMovies(query);
      renderMovies(results, "nowPlayingGrid");
    } else if (query.length===0) {
      container.innerHTML = "";
      nowPlayingPage=1; loadNowPlaying();
    }
  }

  /* ========== MOVIE MODAL ========== */
  async function openMovieModal(movieId, fallbackTitle, isTv=false) {
    currentMovieId = movieId;
    const endpoint = isTv?"/tv/":"/movie/";
    try {
      const detailRes = await fetch(`${TMDB_BASE_URL}${endpoint}${movieId}?api_key=${TMDB_API_KEY}&language=en-US`);
      const detail = await detailRes.json();
      const title = detail.title || detail.name || fallbackTitle;
      document.getElementById("modalTitle").innerText = title;
      document.getElementById("modalDescription").innerText = detail.overview||"No description available.";
      openModal("movieModal");
    } catch(e) {
      console.error("Modal open error:", e);
    }
  }