if(navigator.serviceWorker) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('sw.js').then((reg) => {
            console.log('Service Worker registered!', reg);
        }).catch((err) => {
            console.warn('Error registering Service Worker', err);
        });
    });
}