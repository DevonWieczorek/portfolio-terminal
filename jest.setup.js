const {
    installMatchMediaMock,
    resetMatchMediaMock,
} = require("./__mocks__/matchMediaMock");

beforeAll(() => {
    installMatchMediaMock(window);
    global.fetch =
        global.fetch ||
        jest.fn(() =>
            Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
        );
    window.scrollTo = window.scrollTo || jest.fn();
});

beforeEach(() => {
    resetMatchMediaMock();
});
