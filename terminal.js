(() => {
    const terminal = document.querySelector('.terminal');
    const output = document.querySelector('#terminal-output');
    const toggle = document.querySelector('.terminal-toggle');
    if (!terminal || !output || !toggle) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const phrases = [
        'Welcome to my portfolio.',
        'Take a look at my projects or experience.',
        'Download my resume in the Resume tab.',
        'Enjoy your stay.'
    ];
    let phrase = 0;
    let characters = 0;
    let deleting = false;
    let paused = false;
    let timer;

    function schedule(delay = 70) {
        clearTimeout(timer);
        if (!paused && !document.hidden && !reducedMotion.matches) {
            timer = setTimeout(type, delay);
        }
    }

    function type() {
        const text = phrases[phrase];
        characters += deleting ? -1 : 1;
        output.textContent = text.slice(0, characters);

        if (!deleting && characters === text.length) {
            deleting = true;
            schedule(Math.max(1800, text.length * 65));
        } else if (deleting && characters === 0) {
            deleting = false;
            phrase = (phrase + 1) % phrases.length;
            schedule(350);
        } else {
            schedule(deleting ? 30 : 70);
        }
    }

    function setMotionPreference() {
        clearTimeout(timer);
        toggle.hidden = reducedMotion.matches;
        terminal.classList.toggle('is-animated', !reducedMotion.matches);
        if (reducedMotion.matches) {
            output.textContent = phrases[0];
        } else {
            phrase = 0;
            characters = 0;
            deleting = false;
            output.textContent = '';
            schedule(400);
        }
    }

    toggle.addEventListener('click', () => {
        paused = !paused;
        terminal.classList.toggle('is-paused', paused);
        toggle.textContent = paused ? 'resume' : 'pause';
        toggle.setAttribute('aria-label', `${paused ? 'Resume' : 'Pause'} terminal animation`);
        schedule();
    });

    document.addEventListener('visibilitychange', () => schedule());
    window.addEventListener('pagehide', () => clearTimeout(timer));
    window.addEventListener('pageshow', event => {
        if (event.persisted) schedule();
    });
    reducedMotion.addEventListener('change', setMotionPreference);
    setMotionPreference();
})();
