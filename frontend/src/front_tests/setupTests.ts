import '@testing-library/jest-dom'

// JSDOM lacks some browser APIs, add minimal shims where helpful
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => { },
    removeListener: () => { },
    addEventListener: () => { },
    removeEventListener: () => { },
    dispatchEvent: () => false,
  }),
});

// Default confirm to true, individual tests can override
// @ts-ignore
window.confirm = window.confirm || (() => true);

