/**
 * Jest Test Setup
 * Runs before each test file
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = 3099;

// Mock console to reduce noise during tests
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    // Keep error and warn for debugging
    error: console.error,
    warn: console.warn
};

// Increase timeout for integration tests
jest.setTimeout(10000);

// Clean up after all tests
afterAll(async () => {
    // Allow time for connections to close
    await new Promise(resolve => setTimeout(resolve, 500));
});
