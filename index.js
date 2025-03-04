const tmdbApiKey = "e950e51d5d49e85f7c2f17f01eb23ba3"; // Replace with your TMDb API key
const omdbApiKey = "YOUR_OMDB_API_KEY"; // Replace with your OMDb API key
const jikanApiEndpoint = "https://api.jikan.moe/v4";
const itunesApiEndpoint = "https://itunes.apple.com/search";
const tmdbApiEndpoint = "https://api.themoviedb.org/3";
const omdbApiEndpoint = "http://www.omdbapi.com";
const imgPath = "https://image.tmdb.org/t/p/original"; // Use the original image size for better quality

const apiPaths = {
    fetchAllCategories: `${tmdbApiEndpoint}/genre/movie/list?api_key=${tmdbApiKey}`,
    fetchMoviesList: (id) => `${tmdbApiEndpoint}/discover/movie?api_key=${tmdbApiKey}&with_genres=${id}`,
    fetchTrending: `${tmdbApiEndpoint}/trending/all/day?api_key=${tmdbApiKey}&language=en-US`,
    searchMoviesTMDb: (query) => `${tmdbApiEndpoint}/search/movie?api_key=${tmdbApiKey}&query=${query}`,
    searchMoviesOMDb: (query) => `${omdbApiEndpoint}/?apikey=${omdbApiKey}&s=${query}`,
    searchMoviesiTunes: (query) => `${itunesApiEndpoint}?term=${query}&media=movie`,
    searchAnimeJikan: (query) => `${jikanApiEndpoint}/anime?q=${query}`,
    searchOnYoutube: (query) => `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&key=YOUR_YOUTUBE_API_KEY`
};

let exploredCategoryId = null; // Keep track of the explored category ID
const processedCategories = new Set(); // Keep track of processed categories

// Boots up the app
function init() {
    fetchTrendingMovies();
    fetchAndBuildAllSections();
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

function fetchAndbuildMovieSection(fetchUrl, categoryName, categoryId) {
    console.log(fetchUrl, categoryName);
    return fetch(fetchUrl)
        .then(res => res.json())
        .then(res => {
            const movies = res.results;
            if (Array.isArray(movies) && movies.length) {
                buildMoviesSection(movies, categoryName, categoryId); // Pass the category ID
            }
            return movies;
        })
        .catch(err => console.error(err));
}

function buildMoviesSection(list, categoryName, categoryId) {
    console.log(list, categoryName);

    const moviesCont = document.getElementById('movies-cont');

    const moviesListHTML = list.map(item => {
        return `
        <div class="movie-item" onmouseenter="searchMovieTrailer('${item.title}', 'yt${item.id}')">
            <img decoding="async" class="move-item-img lazy" data-src="${imgPath}${item.poster_path}" alt="${item.title}" />
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

    // Initialize lazy loading
    lazyLoadImages();
}

function lazyLoadImages() {
    const lazyImages = document.querySelectorAll('.lazy');
    const config = {
        rootMargin: '0px 0px 50px 0px',
        threshold: 0.01
    };

    let observer;
    if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver(onIntersection, config);
        lazyImages.forEach(image => {
            observer.observe(image);
        });
    } else {
        lazyImages.forEach(image => {
            loadImage(image);
        });
    }

    function onIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const image = entry.target;
                loadImage(image);
                observer.unobserve(image);
            }
        });
    }

    function loadImage(image) {
        image.src = image.dataset.src;
        image.classList.remove('lazy');
    }
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
    }
});

function searchMovies(query) {
    const tmdbUrl = apiPaths.searchMoviesTMDb(query);
    const omdbUrl = apiPaths.searchMoviesOMDb(query);
    const itunesUrl = apiPaths.searchMoviesiTunes(query);
    const jikanUrl = apiPaths.searchAnimeJikan(query);

    Promise.all([fetch(tmdbUrl), fetch(omdbUrl), fetch(itunesUrl), fetch(jikanUrl)])
        .then(responses => Promise.all(responses.map(res => res.json())))
        .then(data => {
            const tmdbResults = data[0].results || [];
            const omdbResults = data[1].Search || [];
            const itunesResults = data[2].results || [];
            const jikanResults = data[3].data || [];
            const combinedResults = [...tmdbResults, ...omdbResults, ...itunesResults, ...jikanResults];
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
        const posterPath = movie.poster_path ? `${imgPath}${movie.poster_path}` : movie.Poster || movie.artworkUrl100 || movie.images.jpg.image_url;
        const title = movie.title || movie.Title || movie.trackName || movie.title_english;
        return `
        <div class="movie-item">
            <img decoding="async" class="move-item-img lazy" data-src="${posterPath}" alt="${title}" />
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

    // Initialize lazy loading
    lazyLoadImages();
}

