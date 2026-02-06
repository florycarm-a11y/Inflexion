/**
 * Inflexion API Client
 * Connects frontend to Node.js backend
 * Falls back to local data if API unavailable
 */
const InflexionAPI = (function() {
    const BASE_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
        ? 'http://localhost:3001/api'
        : '/api';
    let useAPI = false;
    let apiAvailable = false;

    /**
     * Check if API is available
     */
    async function checkAPI() {
        try {
            const response = await fetch(`${BASE_URL}/../health`, {
                method: 'GET',
                timeout: 3000
            });
            if (response.ok) {
                apiAvailable = true;
                useAPI = true;
                console.log('✓ Inflexion API connected');
                return true;
            }
        } catch (error) {
            console.log('API unavailable, using local data');
        }
        apiAvailable = false;
        useAPI = false;
        return false;
    }

    /**
     * Generic API request
     */
    async function request(endpoint, options = {}) {
        if (!useAPI) {
            throw new Error('API not available');
        }

        const url = `${BASE_URL}${endpoint}`;
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Get articles with filters
     */
    async function getArticles({ category, source, impact, limit = 20, offset = 0 } = {}) {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (source) params.append('source', source);
        if (impact) params.append('impact', impact);
        params.append('limit', limit);
        params.append('offset', offset);

        const result = await request(`/articles?${params}`);
        return result.data;
    }

    /**
     * Get featured articles
     */
    async function getFeatured(limit = 3) {
        const result = await request(`/articles/featured?limit=${limit}`);
        return result.data;
    }

    /**
     * Get breaking news
     */
    async function getBreaking(limit = 10) {
        const result = await request(`/articles/breaking?limit=${limit}`);
        return result.data;
    }

    /**
     * Get latest articles
     */
    async function getLatest(limit = 10) {
        const result = await request(`/articles/latest?limit=${limit}`);
        return result.data;
    }

    /**
     * Get market data
     */
    async function getMarketData() {
        const result = await request('/market');
        return result.data;
    }

    /**
     * Search articles
     */
    async function search(query, options = {}) {
        const params = new URLSearchParams({ q: query, ...options });
        const result = await request(`/search?${params}`);
        return result.data;
    }

    /**
     * Get sources list
     */
    async function getSources() {
        const result = await request('/sources');
        return result.data;
    }

    /**
     * Get categories
     */
    async function getCategories() {
        const result = await request('/categories');
        return result.data;
    }

    /**
     * Initialize API client
     */
    async function init() {
        await checkAPI();
        return apiAvailable;
    }

    /**
     * Check if using API
     */
    function isUsingAPI() {
        return useAPI;
    }

    // Public API
    return {
        init,
        isUsingAPI,
        checkAPI,
        getArticles,
        getFeatured,
        getBreaking,
        getLatest,
        getMarketData,
        search,
        getSources,
        getCategories
    };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InflexionAPI;
}
