(() => {
    const main = document.querySelector('main');
    const navbar = document.querySelector('.navbar');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const storageKey = 'portfolio-page-transition';

    if (!main || !navbar) return;

    const navlist = navbar.querySelector('.navlist');
    const links = [...navbar.querySelectorAll('.navlist a')];
    const activeLink = links.find(link => link.hasAttribute('aria-current'));
    const pages = links.map(link => new URL(link.href).pathname);
    let highlightedLink = activeLink;
    let leaving = false;

    function positionIndicator(link, animate = false) {
        if (!navlist || !link) return;
        highlightedLink = link;
        const listBounds = navlist.getBoundingClientRect();
        const linkBounds = link.getBoundingClientRect();
        navlist.classList.toggle('indicator-moving', animate && !reducedMotion.matches);
        navlist.style.setProperty('--nav-x', `${linkBounds.left - listBounds.left}px`);
        navlist.style.setProperty('--nav-y', `${linkBounds.top - listBounds.top}px`);
        navlist.style.setProperty('--nav-width', `${linkBounds.width}px`);
        navlist.style.setProperty('--nav-height', `${linkBounds.height}px`);
        navlist.classList.add('has-indicator');
    }

    positionIndicator(activeLink);
    window.addEventListener('resize', () => positionIndicator(highlightedLink));
    document.fonts?.ready.then(() => positionIndicator(highlightedLink));

    if (typeof main.animate !== 'function') return;

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
        positionIndicator(links.find(item => item.pathname === destination.pathname), true);

        const direction = pages.indexOf(destination.pathname) >=
            pages.indexOf(location.pathname) ? 1 : -1;

        main.getAnimations().forEach(animation => animation.cancel());
        const exit = main.animate([
            { opacity: 1, transform: 'translateX(0)' },
            { opacity: 0, transform: `translateX(${direction * -24}px)` }
        ], {
            duration: 240,
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
        positionIndicator(activeLink);
        leaving = false;
    });
})();
