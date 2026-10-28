/** Resources owned by one mounted department. No global patches or script evaluation. */
export function createRuntimeScope() {
    const controller = new AbortController();
    const cleanups = [];
    return {
        listen(target, type, listener, options) {
            target.addEventListener(type, listener, options);
            cleanups.push(() => target.removeEventListener(type, listener, options));
        },
        setTimeout(callback, delay) {
            const id = window.setTimeout(callback, delay);
            cleanups.push(() => window.clearTimeout(id));
            return id;
        },
        setInterval(callback, delay) {
            const id = window.setInterval(callback, delay);
            cleanups.push(() => window.clearInterval(id));
            return id;
        },
        fetch(input, options = {}) {
            return fetch(input, {
                ...options,
                signal: options.signal
                    ? AbortSignal.any([controller.signal, options.signal])
                    : controller.signal,
            });
        },
        dispose() {
            controller.abort();
            cleanups
                .splice(0)
                .reverse()
                .forEach((cleanup) => cleanup());
            document.body.classList.remove('print-report');
        },
    };
}
