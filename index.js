const tmdbApiKey = "4626200399b08f9d04b72348e3625f15"; // Replace with your TMDb API key
const jikanApiEndpoint = "https://api.jikan.moe/v4";
const tmdbApiEndpoint = "https://api.themoviedb.org/3";
const imgPath = "https://image.tmdb.org/t/p/original"; // Use the original image size for better quality

const apiPaths = {
    fetchAllCategories: `${tmdbApiEndpoint}/genre/movie/list?api_key=${tmdbApiKey}`,
    fetchMoviesList: (id) => `${tmdbApiEndpoint}/discover/movie?api_key=${tmdbApiKey}&with_genres=${id}`,
    fetchTrending: `${tmdbApiEndpoint}/trending/all/day?api_key=${tmdbApiKey}&language=en-US`,
    searchMoviesTMDb: (query) => `${tmdbApiEndpoint}/search/movie?api_key=${tmdbApiKey}&query=${query}`,
    searchAnimeJikan: (query) => `${jikanApiEndpoint}/anime?q=${query}`,
    fetchPopularMovies: `${tmdbApiEndpoint}/movie/popular?api_key=${tmdbApiKey}&language=en-US`,
    fetchPopularAnime: `${jikanApiEndpoint}/top/anime`,
    searchOnYoutube: (query) => `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&key=YOUR_YOUTUBE_API_KEY`
};

let exploredCategoryId = null; // Keep track of the explored category ID
const processedCategories = new Set(); // Keep track of processed categories

// Boots up the app
function init() {
    fetchTrendingMovies();
    fetchAndBuildAllSections();
    fetchPopularContent();
}

function fetchTrendingMovies() {
    fetchAndbuildMovieSection(apiPaths.fetchTrending, 'Trending Now')
        .then(list => {
            const randomIndex = parseInt(Math.random() * list.length);
            buildBannerSection(list[randomIndex]);
        }).catch(err => {
            console.error(err);
        });
}

function fetchAndBuildAllSections() {
    fetch(apiPaths.fetchAllCategories)
        .then(res => res.json())
        .then(res => {
            const categories = res.genres;
            if (Array.isArray(categories) && categories.length) {
                categories.forEach(category => {
                    if (!processedCategories.has(category.id)) {
                        processedCategories.add(category.id);
                        fetchAndbuildMovieSection(
                            apiPaths.fetchMoviesList(category.id),
                            category.name,
                            category.id // Pass the category ID
                        );
                    }
                });
            }
        })
        .catch(err => console.error(err));
}

function fetchPopularContent() {
    fetchAndbuildMovieSection(apiPaths.fetchPopularMovies, 'Popular Movies');
    fetchAndbuildAnimeSection(apiPaths.fetchPopularAnime, 'Popular Anime');
}

function fetchAndbuildMovieSection(fetchUrl, categoryName, categoryId) {
    console.log(fetchUrl, categoryName);
    return fetch(fetchUrl)
        .then(res => res.json())
        .then(res => {
            const movies = res.results || res.data;
            if (Array.isArray(movies) && movies.length) {
                buildMoviesSection(movies, categoryName, categoryId); // Pass the category ID
            }
            return movies;
        })
        .catch(err => console.error(err));
}

function fetchAndbuildAnimeSection(fetchUrl, categoryName) {
    console.log(fetchUrl, categoryName);
    return fetch(fetchUrl)
        .then(res => res.json())
        .then(res => {
            const anime = res.data;
            if (Array.isArray(anime) && anime.length) {
                buildAnimeSection(anime, categoryName);
            }
            return anime;
        })
        .catch(err => console.error(err));
}

function buildMoviesSection(list, categoryName, categoryId) {
    console.log(list, categoryName);

    const moviesCont = document.getElementById('movies-cont');

    const moviesListHTML = list.map(item => {
        return `
        <div class="movie-item" onmouseenter="searchMovieTrailer('${item.title || item.name}', 'yt${item.id}')">
            <img decoding="async" class="move-item-img" src="${imgPath}${item.poster_path}" alt="${item.title || item.name}" />
            <div class="iframe-wrap" id="yt${item.id}"></div>
        </div>`;
    }).join('');

    const moviesSectionHTML = `
        <h2 class="movie-section-heading">${categoryName}</h2>
        <div class="movies-row">
            ${moviesListHTML}
        </div>
    `;

    const div = document.createElement('div');
    div.className = "movies-section";
    div.innerHTML = moviesSectionHTML;

    // append html into movies container
    moviesCont.append(div);
}

function buildAnimeSection(list, categoryName) {
    console.log(list, categoryName);

    const moviesCont = document.getElementById('movies-cont');

    const moviesListHTML = list.map(item => {
        return `
        <div class="movie-item" onmouseenter="searchMovieTrailer('${item.title_english || item.title}', 'yt${item.mal_id}')">
            <img decoding="async" class="move-item-img" src="${item.images.jpg.image_url}" alt="${item.title_english || item.title}" />
            <div class="iframe-wrap" id="yt${item.mal_id}"></div>
        </div>`;
    }).join('');

    const moviesSectionHTML = `
        <h2 class="movie-section-heading">${categoryName}</h2>
        <div class="movies-row">
            ${moviesListHTML}
        </div>
    `;

    const div = document.createElement('div');
    div.className = "movies-section";
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
            div.innerHTML = `<iframe width="245px" height="150px"  src="https://www.youtube.com/embed/${bestResult.id.videoId}?autoplay=1&controls=0"></iframe>`;
            elements.append(div);

        })
        .catch(err => console.log(err));
}

window.addEventListener('load', function () {
    init();
    window.addEventListener('scroll', function () {
        // header ui update
        const header = document.getElementById('header');
        if (window.scrollY > 5) header.classList.add('black-bg');
        else header.classList.remove('black-bg');
    });
});

// Search functionality
document.getElementById('movieSearch').addEventListener('input', function (event) {
    const query = event.target.value;
    if (query.length > 2) { // Start searching after 3 characters
        searchMovies(query);
    } else {
        // Clear search results and reset to normal when input is empty
        const moviesCont = document.getElementById('movies-cont');
        moviesCont.innerHTML = '';
        fetchTrendingMovies();
        fetchAndBuildAllSections();
        fetchPopularContent();
    }
});

function searchMovies(query) {
    const tmdbUrl = apiPaths.searchMoviesTMDb(query);
    const jikanUrl = apiPaths.searchAnimeJikan(query);

    Promise.all([fetch(tmdbUrl), fetch(jikanUrl)])
        .then(responses => Promise.all(responses.map(res => res.json())))
        .then(data => {
            const tmdbResults = data[0].results || [];
            const jikanResults = data[1].data || [];
            const combinedResults = [...tmdbResults, ...jikanResults];
            displayResults(combinedResults);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

function displayResults(movies) {
    const moviesCont = document.getElementById('movies-cont');
    moviesCont.innerHTML = ''; // Clear previous results

    const moviesListHTML = movies.map(movie => {
        const posterPath = movie.poster_path ? `${imgPath}${movie.poster_path}` : movie.images?.jpg?.image_url;
        const title = movie.title || movie.title_english || movie.name;
        return `
        <div class="movie-item">
            <img decoding="async" class="move-item-img" src="${posterPath}" alt="${title}" />
            <div class="movie-info">
                <h3>${title}</h3>
            </div>
        </div>`;
    }).join('');

    const resultsSectionHTML = `
        <h2 class="movie-section-heading">Search Results</h2>
        <div class="movies-row">
            ${moviesListHTML}
        </div>
    `;

    const div = document.createElement('div');
    div.className = "movies-section";
    div.innerHTML = resultsSectionHTML;

    // append html into movies container
    moviesCont.append(div);
}