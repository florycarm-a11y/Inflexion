/**
 * Unit Tests for Aggregator Service
 * Tests classification and processing logic
 */

const { classifyCategory, classifyImpact } = require('../../src/services/aggregator');

describe('Aggregator Service', () => {
    describe('classifyCategory', () => {
        it('should classify geopolitics articles correctly', () => {
            expect(classifyCategory('Trump announces new tariffs on China', '')).toBe('geopolitics');
            expect(classifyCategory('NATO summit discusses Ukraine conflict', '')).toBe('geopolitics');
            expect(classifyCategory('US sanctions Russian oligarchs', '')).toBe('geopolitics');
            expect(classifyCategory('Trade war escalates between major powers', '')).toBe('geopolitics');
        });

        it('should classify markets articles correctly', () => {
            expect(classifyCategory('Nvidia earnings beat expectations', '')).toBe('markets');
            expect(classifyCategory('S&P 500 reaches new high', '')).toBe('markets');
            expect(classifyCategory('Fed raises interest rates by 25 basis points', '')).toBe('markets');
            expect(classifyCategory('Wall Street reacts to employment data', '')).toBe('markets');
            expect(classifyCategory('Tech stocks rally on AI optimism', '')).toBe('markets');
        });

        it('should classify crypto articles correctly', () => {
            expect(classifyCategory('Bitcoin drops below $70,000', '')).toBe('crypto');
            expect(classifyCategory('Ethereum network upgrade complete', '')).toBe('crypto');
            expect(classifyCategory('Stablecoin regulations proposed', '')).toBe('crypto');
            expect(classifyCategory('DeFi protocols see record volumes', '')).toBe('crypto');
            expect(classifyCategory('Coinbase launches new trading feature', '')).toBe('crypto');
        });

        it('should classify commodities articles correctly', () => {
            expect(classifyCategory('Gold prices hit record high', '')).toBe('commodities');
            expect(classifyCategory('Oil prices surge on OPEC decision', '')).toBe('commodities');
            expect(classifyCategory('Silver demand increases for solar panels', '')).toBe('commodities');
            expect(classifyCategory('Natural gas prices fall on low demand', '')).toBe('commodities');
            expect(classifyCategory('Copper demand rises on EV production', '')).toBe('commodities');
        });

        it('should classify ETF articles correctly', () => {
            expect(classifyCategory('ETF inflows reach record levels', '')).toBe('etf');
            expect(classifyCategory('Vanguard launches new fund', '')).toBe('etf');
            expect(classifyCategory('iShares ETF sees massive outflows', '')).toBe('etf');
            expect(classifyCategory('Index fund performance comparison', '')).toBe('etf');
        });

        it('should default to markets for ambiguous content', () => {
            expect(classifyCategory('Quarterly report released', '')).toBe('markets');
            expect(classifyCategory('Company announces expansion', '')).toBe('markets');
        });

        it('should use description if title has no keywords', () => {
            expect(classifyCategory('Breaking News', 'Bitcoin crashes 20% overnight')).toBe('crypto');
            expect(classifyCategory('Alert', 'Gold surges to new record')).toBe('commodities');
        });
    });

    describe('classifyImpact', () => {
        it('should classify high impact articles', () => {
            expect(classifyImpact('Breaking: Market crash wipes out gains', '')).toBe('high');
            expect(classifyImpact('Stock prices surge to record levels', '')).toBe('high');
            expect(classifyImpact('Historic agreement signed between nations', '')).toBe('high');
            expect(classifyImpact('Emergency measures announced', '')).toBe('high');
            expect(classifyImpact('Market collapse triggers panic', '')).toBe('high');
            expect(classifyImpact('Prices plunge amid crisis', '')).toBe('high');
            expect(classifyImpact('Currency soars to multi-year high', '')).toBe('high');
            expect(classifyImpact('Stocks tumble on unexpected news', '')).toBe('high');
        });

        it('should classify medium impact by default', () => {
            expect(classifyImpact('Company reports quarterly earnings', '')).toBe('medium');
            expect(classifyImpact('Analyst upgrades stock rating', '')).toBe('medium');
            expect(classifyImpact('New product announced', '')).toBe('medium');
            expect(classifyImpact('Market moves slightly higher', '')).toBe('medium');
        });

        it('should check description for impact keywords', () => {
            expect(classifyImpact('News Update', 'Historic deal announced today')).toBe('high');
            expect(classifyImpact('Market Report', 'Prices surge to new record')).toBe('high');
        });

        it('should be case insensitive', () => {
            expect(classifyImpact('BREAKING NEWS', '')).toBe('high');
            expect(classifyImpact('Record High Reached', '')).toBe('high');
            expect(classifyImpact('EMERGENCY MEASURES', '')).toBe('high');
        });
    });
});
/**
 * Unit Tests for Aggregator Service
 * Tests classification and processing logic
 */

const { classifyCategory, classifyImpact } = require('../../src/services/aggregator');

describe('Aggregator Service', () => {
    describe('classifyCategory', () => {
        it('should classify geopolitics articles correctly', () => {
            expect(classifyCategory('Trump announces new tariffs on China', '')).toBe('geopolitics');
            expect(classifyCategory('NATO summit discusses Ukraine conflict', '')).toBe('geopolitics');
            expect(classifyCategory('US sanctions Russian oligarchs', '')).toBe('geopolitics');
            expect(classifyCategory('Trade war escalates between major powers', '')).toBe('geopolitics');
        });

        it('should classify markets articles correctly', () => {
            expect(classifyCategory('Nvidia earnings beat expectations', '')).toBe('markets');
            expect(classifyCategory('S&P 500 reaches new high', '')).toBe('markets');
            expect(classifyCategory('Fed raises interest rates by 25 basis points', '')).toBe('markets');
            expect(classifyCategory('Wall Street reacts to employment data', '')).toBe('markets');
            expect(classifyCategory('Tech stocks rally on AI optimism', '')).toBe('markets');
        });

        it('should classify crypto articles correctly', () => {
            expect(classifyCategory('Bitcoin drops below $70,000', '')).toBe('crypto');
            expect(classifyCategory('Ethereum network upgrade complete', '')).toBe('crypto');
            expect(classifyCategory('Stablecoin regulations proposed', '')).toBe('crypto');
            expect(classifyCategory('DeFi protocols see record volumes', '')).toBe('crypto');
            expect(classifyCategory('Coinbase reports quarterly earnings', '')).toBe('crypto');
        });

        it('should classify commodities articles correctly', () => {
            expect(classifyCategory('Gold prices hit record high', '')).toBe('commodities');
            expect(classifyCategory('Oil prices surge on OPEC decision', '')).toBe('commodities');
            expect(classifyCategory('Silver demand increases for solar panels', '')).toBe('commodities');
            expect(classifyCategory('Natural gas prices fall on warm weather', '')).toBe('commodities');
            expect(classifyCategory('Copper demand rises on EV production', '')).toBe('commodities');
        });

        it('should classify ETF articles correctly', () => {
            expect(classifyCategory('ETF inflows reach record levels', '')).toBe('etf');
            expect(classifyCategory('Vanguard launches new fund', '')).toBe('etf');
            expect(classifyCategory('iShares ETF sees massive outflows', '')).toBe('etf');
            expect(classifyCategory('Index fund performance comparison', '')).toBe('etf');
        });

        it('should default to markets for ambiguous content', () => {
            expect(classifyCategory('Quarterly report released', '')).toBe('markets');
            expect(classifyCategory('Company announces expansion', '')).toBe('markets');
        });

        it('should use description if title has no keywords', () => {
            expect(classifyCategory('Breaking News', 'Bitcoin crashes 20% overnight')).toBe('crypto');
            expect(classifyCategory('Alert', 'Gold surges to new record')).toBe('commodities');
        });
    });

    describe('classifyImpact', () => {
        it('should classify high impact articles', () => {
            expect(classifyImpact('Breaking: Market crash wipes out gains', '')).toBe('high');
            expect(classifyImpact('Stock prices surge to record levels', '')).toBe('high');
            expect(classifyImpact('Historic agreement signed between nations', '')).toBe('high');
            expect(classifyImpact('Emergency measures announced', '')).toBe('high');
            expect(classifyImpact('Market collapse triggers panic', '')).toBe('high');
            expect(classifyImpact('Prices plunge amid crisis', '')).toBe('high');
            expect(classifyImpact('Currency soars to multi-year high', '')).toBe('high');
            expect(classifyImpact('Stocks tumble on unexpected news', '')).toBe('high');
        });

        it('should classify medium impact by default', () => {
            expect(classifyImpact('Company reports quarterly earnings', '')).toBe('medium');
            expect(classifyImpact('Analyst upgrades stock rating', '')).toBe('medium');
            expect(classifyImpact('New product announced', '')).toBe('medium');
            expect(classifyImpact('Market moves slightly higher', '')).toBe('medium');
        });

        it('should check description for impact keywords', () => {
            expect(classifyImpact('News Update', 'Historic deal announced today')).toBe('high');
            expect(classifyImpact('Market Report', 'Prices surge to new record')).toBe('high');
        });

        it('should be case insensitive', () => {
            expect(classifyImpact('BREAKING NEWS', '')).toBe('high');
            expect(classifyImpact('Record High Reached', '')).toBe('high');
            expect(classifyImpact('EMERGENCY MEASURES', '')).toBe('high');
        });
    });
});
