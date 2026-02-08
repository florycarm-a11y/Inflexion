/**
 * Unit Tests for Database Configuration
 * Tests the query wrapper and getClient functions
 */

// Mock pg before importing database module
const mockQuery = jest.fn().mockResolvedValue({ rows: [{ id: 1 }], rowCount: 1 });
const mockRelease = jest.fn();
const mockOn = jest.fn();
const mockConnect = jest.fn().mockResolvedValue({
    query: mockQuery,
    release: mockRelease
});

jest.mock('pg', () => ({
    Pool: jest.fn(() => ({
        query: mockQuery,
        connect: mockConnect,
        on: mockOn
    }))
}));

// Mock dotenv
jest.mock('dotenv', () => ({
    config: jest.fn()
}));

// Now import the actual database module
const { pool, query, getClient } = require('../../src/config/database');

// Save event handler calls before they get cleared by beforeEach
const onCallsAtInit = [...mockOn.mock.calls];

describe('Database Configuration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('pool', () => {
        it('should create a pool instance', () => {
            expect(pool).toBeDefined();
            expect(pool.query).toBeDefined();
            expect(pool.connect).toBeDefined();
        });

        it('should register event handlers at init', () => {
            // Use saved calls from module initialization (before clearAllMocks)
            const connectCall = onCallsAtInit.find(call => call[0] === 'connect');
            const errorCall = onCallsAtInit.find(call => call[0] === 'error');
            expect(connectCall).toBeDefined();
            expect(errorCall).toBeDefined();
        });

        it('should handle connect event', () => {
            const connectHandler = onCallsAtInit.find(call => call[0] === 'connect')[1];
            expect(() => connectHandler()).not.toThrow();
        });

        it('should handle error event', () => {
            const errorHandler = onCallsAtInit.find(call => call[0] === 'error')[1];
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            errorHandler(new Error('pool error'));
            consoleSpy.mockRestore();
        });
    });

    describe('query', () => {
        it('should execute a query and return result', async () => {
            const result = await query('SELECT 1', []);
            expect(mockQuery).toHaveBeenCalledWith('SELECT 1', []);
            expect(result).toEqual({ rows: [{ id: 1 }], rowCount: 1 });
        });

        it('should execute a query without params', async () => {
            const result = await query('SELECT * FROM test');
            expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM test', undefined);
            expect(result.rows).toBeDefined();
        });

        it('should log query in development mode', async () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await query('SELECT * FROM articles WHERE id = $1', [1]);

            process.env.NODE_ENV = originalEnv;
            consoleSpy.mockRestore();
        });

        it('should throw on query error', async () => {
            mockQuery.mockRejectedValueOnce(new Error('query failed'));
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await expect(query('BAD SQL')).rejects.toThrow('query failed');

            consoleSpy.mockRestore();
        });
    });

    describe('getClient', () => {
        it('should return a client from the pool', async () => {
            const client = await getClient();
            expect(mockConnect).toHaveBeenCalled();
            expect(client).toBeDefined();
            expect(client.query).toBeDefined();
            expect(client.release).toBeDefined();
        });

        it('should override release to restore original methods', async () => {
            const client = await getClient();
            // Release should work without error
            expect(() => client.release()).not.toThrow();
        });
    });
});
