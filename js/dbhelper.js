/**
 * Common database helper functions.
 */
class DBHelper {

  static get DB_PROMISE() {
    // If the browser doesn't support service worker,
    // we don't care about having a database
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }
  
    return idb.open('restaturant-reviews', 2, function(upgradeDb) {
      switch(upgradeDb.oldVersion) {
        case 0:
          const store = upgradeDb.createObjectStore('restaurants', {
            keyPath: 'id'
          });
          store.createIndex('by-id', 'id');
        case 1:
          const reviewsStore = upgradeDb.createObjectStore('reviews', {
            keyPath: 'id'
          });
          reviewsStore.createIndex('by-restaurant-id', 'restaurant_id');
      }
    });
  }

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {

    fetch(`${DBHelper.DATABASE_URL}/restaurants`)
    .then(data => data.json())
    .then(restaurants => {
      DBHelper.DB_PROMISE.then(db => {
        const tx = db.transaction('restaurants', 'readwrite');
        const restaurantStore = tx.objectStore('restaurants');

        restaurants.forEach(restaurant => {
          restaurantStore.put(restaurant);
        });
      });

      callback(null, restaurants)
    })
    .catch(error => {
      DBHelper.DB_PROMISE.then(db => {
        const tx = db.transaction('restaurants');
        const restaurantStore = tx.objectStore('restaurants');
        restaurantStore.getAll().then(restaurants => {
          callback(null, restaurants);
        })
      })
      .catch(error => callback(error, null));
    });

  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch restaurant by id with proper error handling.
    fetch(`${DBHelper.DATABASE_URL}/restaurants/${id}`)
    .then(data => data.json())
    .then(restaurant => {
      DBHelper.DB_PROMISE.then(db => {
        const tx = db.transaction('restaurants', 'readwrite');
        const restaurantStore = tx.objectStore('restaurants');

        restaurantStore.put(restaurant);
      });

      return restaurant;
      // callback(null, restaurants)
    })
    .then(restaurant => {
      DBHelper.fetchReviewsById(id).then(reviews => {
        restaurant.reviews = reviews;
        callback(null, restaurant);
      })
    })
    .catch(() => {
      DBHelper.DB_PROMISE.then(db => {
        const tx = db.transaction('restaurants');
        const restaurantStore = tx.objectStore('restaurants');
        const reviewsStore = tx.objectStore('reviews');
        const reviewsIndex = reviewsStore.index('by-restaurant-id');
        
        restaurantStore.getAll(`${id}`).then(restaurant => {
          return restaurant
          // callback(null, restaurant);
        })
        .then(restaurant => {
          reviewsIndex.getAll(`${id}`).then(reviews => {
            restaurant.reviews = reviews;
            callback(null, restaurant);
          });
        }); 
      })
      .catch(error => callback(error, null));
    });
  }

  /**
   * Fetch a reviews by restaurant ID.
   */
  static fetchReviewsById(id) {
    return fetch(`${DBHelper.DATABASE_URL}/reviews?restaurant_id=${id}`)
    .then(data => data.json())
    .then(reviews => {
      console.log('Reviews from fetch:', reviews);

      DBHelper.DB_PROMISE.then(db => {
        const tx = db.transaction('reviews', 'readwrite');
        const reviewStore = tx.objectStore('reviews');

        reviews.forEach(review => {
          reviewStore.put(review);
        });
      });

      // callback(null, reviews)
      return reviews;
    })
    .catch(() => {
      DBHelper.DB_PROMISE.then(db => {
        const tx = db.transaction('reviews');
        const reviewsStore = tx.objectStore('reviews');
        const reviewsIndex = reviewsStore.index('by-restaurant-id');

        reviewsIndex.getAll(`${id}`).then(reviews => {
          console.log('Reviews from idb:', reviews);
          return reviews;
          // callback(null, reviews);
        })
      })
      .catch(error => error);
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  }

  /**
   * Toggle restaurant as favorite
   */
  static toggleFavorite(restaurantId, isFavorite) {
    const putUrl = `${DBHelper.DATABASE_URL}/restaurants/${restaurantId}/?is_favorite=${isFavorite}`;
    
    const putOptions = {
      method: 'PUT'
    };

    fetch(putUrl, putOptions)
    .then(resp => {
      console.log('put response', resp);
    })
    .catch(error => {
      console.log('error toggling favorite', error);
    });

  }

}
