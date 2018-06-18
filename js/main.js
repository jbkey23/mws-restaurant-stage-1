let restaurants,
  neighborhoods,
  cuisines
// var map
var newMap
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap();
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Add listner for show map button
 */
const showMapBtn = document.querySelector('.show-map-btn');
showMapBtn.addEventListener('click', function() {
  const mapContainer = document.querySelector('#map');

  let isExpanded = this.getAttribute('aria-expanded') === 'true';

  if(!isExpanded) {
    this.textContent = 'Hide Map ▲';
    mapContainer.classList.add('show');
  }
  else {
    this.textContent = 'Show Map ▼'
    mapContainer.classList.remove('show');
  }
  
  isExpanded = !isExpanded;
  this.setAttribute('aria-expanded', isExpanded);
});

/**
 * Add intersection observers to lazy load restaurant images
 */
const config = {
  rootMargin: '0px',
  threshold: 0.3
};

let imageObserver = new IntersectionObserver(function(entries, self) {
  entries.forEach(entry => {
    if(entry.isIntersecting) {
      loadImage(entry.target);

      self.unobserve(entry.target);
    }
  });
}, config);

/**
 * Load image src using data-src attribute
 */
const loadImage = (img) => {
  const src = img.getAttribute('data-src');
  if(!src) return;
  img.src = src;
};


/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

const mapboxToken = 'pk.eyJ1IjoiamtleTIzIiwiYSI6ImNqaWJwZWRyNzA0dXgzcHIzODdkbjhseGsifQ.dhABWlTNS9eYEhtvdpFosQ';

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
  self.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
        scrollWheelZoom: false
      });
  L.tileLayer(`https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token=${mapboxToken}`, {
    mapboxToken: `${mapboxToken}`,
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);

  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');
  const favFilter = document.getElementById('show-fav-filter');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;
  const showFav = favFilter.checked;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      if(showFav) {
        restaurants = restaurants.filter(r => r.is_favorite == 'true');
      }
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.removeFrom(newMap));
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.alt = restaurant.alt_text;
  image.dataset.src = `${DBHelper.imageUrlForRestaurant(restaurant)}_400.jpg`;
  imageObserver.observe(image);
  li.append(image);

  const details = document.createElement('div')
  details.className = 'restaurant-details';
  li.append(details);

  const favBtn = document.createElement('button');
  favBtn.dataset.restaurantId = restaurant.id;
  favBtn.setAttribute('aria-label', 'Favorite Restaurant');
  const isFavorite = restaurant.is_favorite;
  favBtn.innerHTML = isFavorite == 'true' ? '★' : '☆';
  favBtn.setAttribute('aria-pressed', isFavorite);
  favBtn.className = 'fav-btn';
  favBtn.addEventListener('click', toggleFavorite);
  details.append(favBtn);

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  details.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  details.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  details.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  details.append(more);

  return li;
};

/**
 * Toggle favorite button on restaurant card
 */
const toggleFavorite = function(event) {
  const restaurantId = this.dataset.restaurantId;
  
  const isPressed = this.getAttribute('aria-pressed') === 'true';
  
  if(isPressed) {
    this.innerHTML = '☆';
  }
  else {
    this.innerHTML = '★';
  }

  DBHelper.toggleFavorite(restaurantId, !isPressed, (error) => {
    if(error) {
      console.error(error);
    }
    else {
      const favFilter = document.getElementById('show-fav-filter');
      if(favFilter.checked) {
        updateRestaurants();
      }
    }
  });
  this.setAttribute('aria-pressed', !isPressed);
}

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }

    self.markers.push(marker);
  });
}
