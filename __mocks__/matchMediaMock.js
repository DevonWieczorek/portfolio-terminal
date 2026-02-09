const matchMediaState = { matches: false };

const matchMediaMock = jest.fn(query => ({
    matches: matchMediaState.matches,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
}));

function installMatchMediaMock(targetWindow = window) {
    Object.defineProperty(targetWindow, "matchMedia", {
        writable: true,
        value: matchMediaMock,
    });
}

function resetMatchMediaMock() {
    matchMediaState.matches = false;
    matchMediaMock.mockClear();
}

function setMatchMediaMatches(matches) {
    matchMediaState.matches = matches;
}

module.exports = {
    installMatchMediaMock,
    matchMediaMock,
    resetMatchMediaMock,
    setMatchMediaMatches,
};
