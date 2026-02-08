/**
 * Extended Unit Tests for Aggregator Service
 * Tests fetchRSS, extractImage, processArticles, aggregateAll, startScheduler, triggerAggregation
 */

// Mock dependencies before imports
const mockParseURL = jest.fn();
jest.mock('rss-parser', () => {
    return jest.fn().mockImplementation(() => ({
        parseURL: mockParseURL
    }));
});

jest.mock('axios');

// Mock cheerio
jest.mock('cheerio', () => ({
    load: jest.fn((html) => {
        // Simple mock that extracts src from img tags
        const srcMatch = html.match(/src="([^"]+)"/);
        return (selector) => ({
            first: () => ({
                attr: (attrName) => {
                    if (attrName === 'src' && srcMatch) return srcMatch[1];
                    return null;
                }
            })
        });
    })
}));

// Mock node-cron
const mockCronSchedule = jest.fn();
jest.mock('node-cron', () => ({
    schedule: mockCronSchedule
}));

// Mock database
const mockDbQuery = jest.fn();
jest.mock('../../src/config/database', () => ({
    query: mockDbQuery,
    pool: { connect: jest.fn(), end: jest.fn() }
}));

// Mock Article model
const mockArticleCreate = jest.fn();
jest.mock('../../src/models/Article', () => ({
    create: mockArticleCreate
}));

// Now import the module under test
const {
    classifyCategory,
    classifyImpact,
    fetchRSS,
    aggregateAll,
    startScheduler,
    triggerAggregation
} = require('../../src/services/aggregator');

// Also get extractImage via module internals
// Since extractImage is not exported, we test it indirectly through fetchRSS

describe('Aggregator Service - Extended Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockDbQuery.mockResolvedValue({ rows: [], rowCount: 0 });
    });

    describe('fetchRSS', () => {
        it('should return empty array if source has no rss_url', async () => {
            const result = await fetchRSS({ id: 1, name: 'Test' });
            expect(result).toEqual([]);
            expect(mockParseURL).not.toHaveBeenCalled();
        });

        it('should return empty array if rss_url is null', async () => {
            const result = await fetchRSS({ id: 1, name: 'Test', rss_url: null });
            expect(result).toEqual([]);
        });

        it('should fetch and parse RSS feed', async () => {
            mockParseURL.mockResolvedValue({
                items: [
                    {
                        guid: 'guid1',
                        title: '  Bitcoin Drops  ',
                        contentSnippet: '  BTC fell overnight  ',
                        link: 'https://example.com/article1',
                        enclosure: { url: 'https://example.com/img1.jpg' },
                        creator: 'John',
                        pubDate: '2026-02-01T00:00:00Z'
                    },
                    {
                        link: 'https://example.com/article2',
                        title: '  Markets Rally  ',
                        content: '<p>Content here <img src="https://example.com/img2.jpg"></p>',
                        author: 'Jane',
                        pubDate: null
                    }
                ]
            });

            const source = { id: 5, name: 'TestSource', rss_url: 'https://example.com/rss' };
            const result = await fetchRSS(source);

            expect(mockParseURL).toHaveBeenCalledWith('https://example.com/rss');
            expect(result).toHaveLength(2);
            expect(result[0].source_id).toBe(5);
            expect(result[0].title).toBe('Bitcoin Drops');
            expect(result[0].description).toBe('BTC fell overnight');
            expect(result[0].external_id).toBe('guid1');
            expect(result[0].image_url).toBe('https://example.com/img1.jpg');
            expect(result[0].author).toBe('John');
            expect(result[0].published_at).toEqual(new Date('2026-02-01T00:00:00Z'));

            // Second article uses link as external_id, content instead of contentSnippet
            expect(result[1].external_id).toBe('https://example.com/article2');
            expect(result[1].author).toBe('Jane');
            expect(result[1].published_at).toBeNull();
        });

        it('should handle RSS fetch errors gracefully', async () => {
            mockParseURL.mockRejectedValue(new Error('Network error'));
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const source = { id: 1, name: 'Broken', rss_url: 'https://broken.com/rss' };
            const result = await fetchRSS(source);

            expect(result).toEqual([]);
            consoleSpy.mockRestore();
        });

        it('should handle feed with no items', async () => {
            mockParseURL.mockResolvedValue({ items: [] });
            const source = { id: 1, name: 'Empty', rss_url: 'https://empty.com/rss' };
            const result = await fetchRSS(source);
            expect(result).toEqual([]);
        });
        it('should handle articles without title', async () => {
            mockParseURL.mockResolvedValue({
                items: [
                    {
                        link: 'https://example.com/notitle',
                        contentSnippet: 'No title here'
                    }
                ]
            });
            const source = { id: 1, name: 'Test', rss_url: 'https://test.com/rss' };
            const result = await fetchRSS(source);
            expect(result).toHaveLength(1);
            expect(result[0].title).toBeUndefined();
        });

        it('should extract image from content when no enclosure', async () => {
            mockParseURL.mockResolvedValue({
                items: [
                    {
                        title: 'Test',
                        link: 'https://example.com/test',
                        content: '<div><img src="https://img.com/photo.jpg" alt="photo"></div>'
                    }
                ]
            });
            const source = { id: 1, name: 'Test', rss_url: 'https://test.com/rss' };
            const result = await fetchRSS(source);
            expect(result[0].image_url).toBe('https://img.com/photo.jpg');
        });

        it('should handle null content for image extraction', async () => {
            mockParseURL.mockResolvedValue({
                items: [
                    {
                        title: 'No Content',
                        link: 'https://example.com/test'
                        // No content, no enclosure
                    }
                ]
            });
            const source = { id: 1, name: 'Test', rss_url: 'https://test.com/rss' };
            const result = await fetchRSS(source);
            expect(result[0].image_url).toBeNull();
        });
    });

    describe('aggregateAll', () => {
        it('should aggregate articles from all active sources', async () => {
            // Mock sources query
            mockDbQuery.mockImplementation((sql) => {
                if (sql.includes('FROM sources')) {
                    return Promise.resolve({
                        rows: [
                            { id: 1, name: 'Source1', rss_url: 'https://source1.com/rss', is_active: true },
                            { id: 2, name: 'Source2', rss_url: 'https://source2.com/rss', is_active: true }
                        ],
                        rowCount: 2
                    });
                }
                if (sql.includes('FROM categories')) {
                    return Promise.resolve({
                        rows: [
                            { id: 1, slug: 'markets' },
                            { id: 2, slug: 'crypto' }
                        ],
                        rowCount: 2
                    });
                }
                return Promise.resolve({ rows: [], rowCount: 0 });
            });

            // Mock RSS parser to return articles for each source
            mockParseURL
                .mockResolvedValueOnce({
                    items: [
                        { title: 'Article 1', link: 'https://source1.com/a1', guid: 'g1', contentSnippet: 'Test' }
                    ]
                })
                .mockResolvedValueOnce({
                    items: [
                        { title: 'Article 2', link: 'https://source2.com/a2', guid: 'g2', contentSnippet: 'Test' }
                    ]
                });

            mockArticleCreate.mockResolvedValue({ id: 'new' });

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const result = await aggregateAll();

            expect(result).toHaveProperty('saved');
            expect(result).toHaveProperty('errors');
            consoleSpy.mockRestore();
        });

        it('should handle sources with no RSS articles', async () => {
            mockDbQuery.mockImplementation((sql) => {
                if (sql.includes('FROM sources')) {
                    return Promise.resolve({
                        rows: [{ id: 1, name: 'Empty', rss_url: 'https://empty.com/rss' }],
                        rowCount: 1
                    });
                }
                return Promise.resolve({ rows: [], rowCount: 0 });
            });

            mockParseURL.mockResolvedValue({ items: [] });

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const result = await aggregateAll();

            expect(result.saved).toBe(0);
            expect(result.errors).toBe(0);
            consoleSpy.mockRestore();
        });

        it('should handle no active sources', async () => {
            mockDbQuery.mockResolvedValue({ rows: [], rowCount: 0 });

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const result = await aggregateAll();

            expect(result.saved).toBe(0);
            expect(result.errors).toBe(0);
            consoleSpy.mockRestore();
        });
        it('should handle article save errors (non-duplicate)', async () => {
            mockDbQuery.mockImplementation((sql) => {
                if (sql.includes('FROM sources')) {
                    return Promise.resolve({
                        rows: [{ id: 1, name: 'Source1', rss_url: 'https://s1.com/rss' }],
                        rowCount: 1
                    });
                }
                if (sql.includes('FROM categories')) {
                    return Promise.resolve({
                        rows: [{ id: 1, slug: 'markets' }],
                        rowCount: 1
                    });
                }
                return Promise.resolve({ rows: [], rowCount: 0 });
            });

            mockParseURL.mockResolvedValue({
                items: [{ title: 'Article', link: 'https://s1.com/a1', guid: 'g1' }]
            });

            mockArticleCreate.mockRejectedValue(new Error('connection failed'));

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = await aggregateAll();
            expect(result.errors).toBeGreaterThanOrEqual(1);

            consoleSpy.mockRestore();
            consoleErrorSpy.mockRestore();
        });

        it('should skip duplicate errors silently', async () => {
            mockDbQuery.mockImplementation((sql) => {
                if (sql.includes('FROM sources')) {
                    return Promise.resolve({
                        rows: [{ id: 1, name: 'Source1', rss_url: 'https://s1.com/rss' }],
                        rowCount: 1
                    });
                }
                if (sql.includes('FROM categories')) {
                    return Promise.resolve({
                        rows: [{ id: 1, slug: 'markets' }],
                        rowCount: 1
                    });
                }
                return Promise.resolve({ rows: [], rowCount: 0 });
            });

            mockParseURL.mockResolvedValue({
                items: [{ title: 'Article', link: 'https://s1.com/a1', guid: 'g1' }]
            });

            mockArticleCreate.mockRejectedValue(new Error('duplicate key value'));

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const result = await aggregateAll();
            // Duplicate error should not count as an error
            expect(result.errors).toBe(0);
            consoleSpy.mockRestore();
        });

        it('should skip articles without title or url', async () => {
            mockDbQuery.mockImplementation((sql) => {
                if (sql.includes('FROM sources')) {
                    return Promise.resolve({
                        rows: [{ id: 1, name: 'Source1', rss_url: 'https://s1.com/rss' }],
                        rowCount: 1
                    });
                }
                if (sql.includes('FROM categories')) {
                    return Promise.resolve({
                        rows: [{ id: 1, slug: 'markets' }],
                        rowCount: 1
                    });
                }
                return Promise.resolve({ rows: [], rowCount: 0 });
            });

            mockParseURL.mockResolvedValue({
                items: [
                    { title: null, link: 'https://s1.com/a1' },   // no title
                    { title: 'Has Title', link: null }              // no url
                ]
            });

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const result = await aggregateAll();
            expect(result.saved).toBe(0);
            consoleSpy.mockRestore();
        });
    });

    describe('startScheduler', () => {
        it('should set up cron schedule and run immediately', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            // Mock aggregateAll indirectly - it will fail due to DB mock but catch handles it
            mockDbQuery.mockResolvedValue({ rows: [], rowCount: 0 });

            startScheduler();

            expect(mockCronSchedule).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(Function)
            );

            consoleSpy.mockRestore();
            consoleErrorSpy.mockRestore();
        });

        it('should use AGGREGATION_CRON env var', () => {
            const originalCron = process.env.AGGREGATION_CRON;
            process.env.AGGREGATION_CRON = '0 */6 * * *';

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            mockDbQuery.mockResolvedValue({ rows: [], rowCount: 0 });

            startScheduler();

            expect(mockCronSchedule).toHaveBeenCalledWith('0 */6 * * *', expect.any(Function));

            process.env.AGGREGATION_CRON = originalCron;
            consoleSpy.mockRestore();
            consoleErrorSpy.mockRestore();
        });
    });

    describe('triggerAggregation', () => {
        it('should call aggregateAll and return result', async () => {
            mockDbQuery.mockResolvedValue({ rows: [], rowCount: 0 });

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const result = await triggerAggregation();

            expect(result).toHaveProperty('saved');
            expect(result).toHaveProperty('errors');
            consoleSpy.mockRestore();
        });
    });
});
