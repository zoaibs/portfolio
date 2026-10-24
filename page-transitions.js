(() => {
    const main = document.querySelector('main');
    const navbar = document.querySelector('.navbar');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const storageKey = 'portfolio-page-transition';

    if (!main || !navbar || typeof main.animate !== 'function') return;

    const pages = [...document.querySelectorAll('.navlist a')]
        .map(link => new URL(link.href).pathname);
    let leaving = false;

    // Only animate arrivals that follow one of our navbar clicks.
    try {
        const arrival = JSON.parse(sessionStorage.getItem(storageKey));
        sessionStorage.removeItem(storageKey);

        if (arrival?.url === location.href &&
            Date.now() - arrival.time < 10000 && !reducedMotion.matches) {
            main.animate([
                { opacity: 0, transform: `translateX(${arrival.direction * 32}px)` },
                { opacity: 1, transform: 'translateX(0)' }
            ], {
                duration: 280,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
            });
        }
    } catch {
        // Navigation still works when browser storage is unavailable.
    }

    navbar.addEventListener('click', event => {
        const link = event.target.closest('a');
        if (!link || event.defaultPrevented || event.button !== 0 ||
            event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
            link.hasAttribute('download') ||
            (link.target && link.target !== '_self')) return;

        const destination = new URL(link.href);
        if (destination.origin !== location.origin ||
            !pages.includes(destination.pathname) ||
            destination.href === location.href || reducedMotion.matches) return;

        event.preventDefault();
        if (leaving) return;
        leaving = true;

        const direction = pages.indexOf(destination.pathname) >=
            pages.indexOf(location.pathname) ? 1 : -1;

        main.getAnimations().forEach(animation => animation.cancel());
        const exit = main.animate([
            { opacity: 1, transform: 'translateX(0)' },
            { opacity: 0, transform: `translateX(${direction * -24}px)` }
        ], {
            duration: 160,
            easing: 'ease-in',
            fill: 'forwards'
        });

        const navigate = () => {
            try {
                sessionStorage.setItem(storageKey, JSON.stringify({
                    url: destination.href,
                    direction,
                    time: Date.now()
                }));
            } catch {
                // Storage is optional; never let it block the destination.
            }
            location.assign(destination.href);
        };

        exit.finished.then(navigate, navigate);
    });

    // A page restored by Back/Forward must not keep its faded-out exit state.
    window.addEventListener('pageshow', event => {
        if (!event.persisted) return;
        main.getAnimations().forEach(animation => animation.cancel());
        leaving = false;
    });
})();
