/**
 * Unit Tests for Article Model
 * Tests all Article model methods directly
 */

// Mock database
const mockQuery = jest.fn();
jest.mock('../../src/config/database', () => ({
    query: mockQuery,
    pool: { connect: jest.fn(), end: jest.fn() }
}));

const Article = require('../../src/models/Article');

describe('Article Model', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default mock: return empty rows
        mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });
    });

    describe('findAll', () => {
        it('should return all articles with default params', async () => {
            mockQuery.mockResolvedValue({ rows: [{ id: 1, title: 'Test' }], rowCount: 1 });
            const result = await Article.findAll();
            expect(mockQuery).toHaveBeenCalled();
            expect(result).toEqual([{ id: 1, title: 'Test' }]);
        });

        it('should filter by category', async () => {
            mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });
            await Article.findAll({ category: 'markets' });
            const sql = mockQuery.mock.calls[0][0];
            expect(sql).toContain('category_slug');
        });

        it('should filter by source', async () => {
            await Article.findAll({ source: 'bloomberg' });
            const sql = mockQuery.mock.calls[0][0];
            expect(sql).toContain('source_slug');
        });

        it('should filter by impact', async () => {
            await Article.findAll({ impact: 'high' });
            const sql = mockQuery.mock.calls[0][0];
            expect(sql).toContain('impact');
        });

        it('should filter by featured', async () => {
            await Article.findAll({ featured: true });
            const sql = mockQuery.mock.calls[0][0];
            expect(sql).toContain('is_featured');
        });

        it('should use custom limit and offset', async () => {
            await Article.findAll({ limit: 5, offset: 10 });
            const params = mockQuery.mock.calls[0][1];
            expect(params).toContain(5);
            expect(params).toContain(10);
        });

        it('should apply all filters simultaneously', async () => {
            await Article.findAll({ category: 'crypto', source: 'coindesk', impact: 'high', featured: true, limit: 10, offset: 0 });
            const sql = mockQuery.mock.calls[0][0];
            expect(sql).toContain('category_slug');
            expect(sql).toContain('source_slug');
            expect(sql).toContain('impact');
            expect(sql).toContain('is_featured');
        });
    });

    describe('findById', () => {
        it('should return an article by ID', async () => {
            mockQuery.mockResolvedValue({ rows: [{ id: 'abc', title: 'Found' }], rowCount: 1 });
            const result = await Article.findById('abc');
            expect(result).toEqual({ id: 'abc', title: 'Found' });
            expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('id = $1'), ['abc']);
        });

        it('should return undefined if not found', async () => {
            mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });
            const result = await Article.findById('nonexistent');
            expect(result).toBeUndefined();
        });
    });

    describe('getFeatured', () => {
        it('should return featured articles with default limit', async () => {
            mockQuery.mockResolvedValue({ rows: [{ id: 1 }], rowCount: 1 });
            const result = await Article.getFeatured();
            expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('is_featured'), [3]);
            expect(result).toEqual([{ id: 1 }]);
        });

        it('should accept custom limit', async () => {
            await Article.getFeatured(5);
            expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [5]);
        });
    });

    describe('getBreaking', () => {
        it('should return breaking articles with default limit', async () => {
            mockQuery.mockResolvedValue({ rows: [{ id: 1 }], rowCount: 1 });
            const result = await Article.getBreaking();
            expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('is_breaking'), [10]);
            expect(result).toEqual([{ id: 1 }]);
        });

        it('should accept custom limit', async () => {
            await Article.getBreaking(5);
            expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [5]);
        });
    });
    describe('getLatest', () => {
        it('should return latest articles with default limit', async () => {
            mockQuery.mockResolvedValue({ rows: [{ id: 1 }], rowCount: 1 });
            const result = await Article.getLatest();
            expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('impact'), [10]);
            expect(result).toEqual([{ id: 1 }]);
        });

        it('should accept custom limit', async () => {
            await Article.getLatest(3);
            expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [3]);
        });
    });

    describe('create', () => {
        it('should create a new article', async () => {
            const articleData = {
                source_id: 1,
                category_id: 1,
                external_id: 'ext1',
                title: 'Test Article',
                description: 'Description',
                content: 'Full content',
                url: 'https://example.com/article',
                image_url: 'https://example.com/img.jpg',
                author: 'Author',
                published_at: new Date(),
                impact: 'high',
                sentiment: 'positive',
                is_featured: true,
                is_breaking: false,
                metadata: { key: 'value' }
            };

            mockQuery.mockResolvedValue({ rows: [{ id: 'new', ...articleData }], rowCount: 1 });
            const result = await Article.create(articleData);
            expect(result.title).toBe('Test Article');
            expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO articles'), expect.any(Array));
        });

        it('should use default values', async () => {
            const minimalData = {
                source_id: 1,
                title: 'Minimal',
                url: 'https://example.com'
            };
            mockQuery.mockResolvedValue({ rows: [{ id: 'new' }], rowCount: 1 });
            await Article.create(minimalData);
            // Should use default impact='medium', is_featured=false, is_breaking=false
            const params = mockQuery.mock.calls[0][1];
            expect(params).toContain('medium'); // default impact
        });
    });

    describe('update', () => {
        it('should update an article', async () => {
            mockQuery.mockResolvedValue({ rows: [{ id: 'abc', title: 'Updated' }], rowCount: 1 });
            const result = await Article.update('abc', { title: 'Updated' });
            expect(result.title).toBe('Updated');
            expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('UPDATE articles'), expect.any(Array));
        });

        it('should return null for empty updates', async () => {
            const result = await Article.update('abc', {});
            expect(result).toBeNull();
            expect(mockQuery).not.toHaveBeenCalled();
        });

        it('should handle multiple fields', async () => {
            mockQuery.mockResolvedValue({ rows: [{ id: 'abc' }], rowCount: 1 });
            await Article.update('abc', { title: 'New Title', impact: 'high', description: 'New desc' });
            const sql = mockQuery.mock.calls[0][0];
            expect(sql).toContain('title');
            expect(sql).toContain('impact');
            expect(sql).toContain('description');
        });
    });

    describe('delete', () => {
        it('should delete an article and return true', async () => {
            mockQuery.mockResolvedValue({ rows: [{ id: 'abc' }], rowCount: 1 });
            const result = await Article.delete('abc');
            expect(result).toBe(true);
        });

        it('should return false if article not found', async () => {
            mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });
            const result = await Article.delete('nonexistent');
            expect(result).toBe(false);
        });
    });

    describe('addTags', () => {
        it('should add tags to an article', async () => {
            await Article.addTags('article1', [1, 2, 3]);
            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('article_tags'),
                expect.arrayContaining(['article1', 1, 2, 3])
            );
        });

        it('should handle single tag', async () => {
            await Article.addTags('article1', [5]);
            const params = mockQuery.mock.calls[0][1];
            expect(params).toEqual(['article1', 5]);
        });
    });

    describe('search', () => {
        it('should search articles by term', async () => {
            mockQuery.mockResolvedValue({ rows: [{ id: 1, title: 'Bitcoin news' }], rowCount: 1 });
            const result = await Article.search('bitcoin');
            expect(result).toEqual([{ id: 1, title: 'Bitcoin news' }]);
            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('ILIKE'),
                ['%bitcoin%', 20]
            );
        });

        it('should accept custom limit', async () => {
            await Article.search('test', 5);
            expect(mockQuery).toHaveBeenCalledWith(expect.any(String), ['%test%', 5]);
        });
    });

    describe('countByCategory', () => {
        it('should return category counts', async () => {
            const mockCounts = [
                { slug: 'markets', name: 'March\u00e9s', count: 15 },
                { slug: 'crypto', name: 'Crypto', count: 5 }
            ];
            mockQuery.mockResolvedValue({ rows: mockCounts, rowCount: 2 });
            const result = await Article.countByCategory();
            expect(result).toEqual(mockCounts);
            expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('COUNT'));
        });
    });
});
