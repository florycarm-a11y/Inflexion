# CLAUDE.MD - AI Assistant Context

## Project Overview

This is a geopolitical and financial markets news aggregation website that provides real-time market data and curated news across multiple categories. The project is a pure front-end application built with vanilla HTML, CSS, and JavaScript.

**Project Name**: Géopolitique & Marchés
**Type**: Static web application
**Primary Language**: French (UI and content)
**Tech Stack**: HTML5, CSS3, Vanilla JavaScript

## Purpose

The website aggregates and presents international news with focus on:
- **Geopolitics**: Global events and international tensions
- **Financial Markets**: Stock market indices and analysis
- **Cryptocurrencies**: Bitcoin, Ethereum, and altcoins
- **Commodities**: Gold, oil, metals, agriculture
- **ETFs**: Index funds and investments

## Architecture

### File Structure

```
Claude/
├── index.html      # Main HTML structure and semantic markup
├── styles.css      # All styling, responsive design, CSS variables
├── app.js          # Application logic, data management, UI updates
├── README.md       # User-facing documentation (French)
└── CLAUDE.MD       # This file - AI assistant context
```

### Key Components

#### index.html
- Semantic HTML5 structure
- Navigation with category links (Géopolitique, Marchés, Crypto, Matières Premières, ETF)
- Market data ticker (4 key indicators: BTC, Gold, Oil, S&P 500)
- News grid sections for each category
- No external dependencies except Google Fonts (Inter)

#### styles.css
- CSS custom properties (variables) for theming
- Dark mode design (professional blue/gray palette)
- Responsive grid layouts (Desktop → Tablet → Mobile)
- Animations for smooth interactions
- Utility classes for consistent spacing and typography

#### app.js
- `newsDatabase` object: Contains all news articles organized by category
- `marketData` array: Simulated real-time market indicators
- `updateMarketData()`: Refreshes market prices every 10 seconds
- `loadNews()`: Renders news cards with animations
- Intersection Observer API for active section detection
- Smooth scroll navigation

## Design Patterns

### Color System
Defined in CSS variables at `:root`:
- Primary: `#2563eb` (blue)
- Success: `#10b981` (green) - for positive market movements
- Danger: `#ef4444` (red) - for negative market movements
- Warning: `#f59e0b` (amber)
- Dark backgrounds: Various shades of `#0f172a` to `#334155`

### Data Structure

News articles follow this schema:
```javascript
{
    id: number,
    title: string,
    source: string,
    time: string,
    category: string,
    tags: string[]
}
```

Market data follows this schema:
```javascript
{
    name: string,
    symbol: string,
    price: number,
    change: number,
    changePercent: number
}
```

### Responsive Breakpoints
- Desktop: Default (> 1024px)
- Tablet: 768px - 1024px
- Mobile: < 768px

## Development Guidelines

### When Modifying HTML
- Maintain semantic structure (header, nav, main, section, article)
- Keep accessibility in mind (ARIA labels where needed)
- All user-facing text should be in French
- Preserve the grid structure for news items

### When Modifying CSS
- Use CSS variables for colors and spacing
- Follow mobile-first responsive design principles
- Maintain the dark theme aesthetic
- Use the existing utility classes before creating new ones
- Keep animations subtle and performant

### When Modifying JavaScript
- Keep vanilla JavaScript (no frameworks)
- Maintain the current update intervals (10s for market, 60s for news)
- Follow the existing naming conventions (camelCase)
- Keep functions pure and focused on single responsibilities
- Preserve the Observer pattern for section detection

## Important Constraints

1. **No Build System**: This is a static site with no bundlers or transpilers
2. **No External Dependencies**: Only vanilla JS (except Google Fonts)
3. **Simulated Data**: Market data is currently simulated, not from real APIs
4. **Static News**: News articles are hardcoded in app.js
5. **French Language**: All UI text and content must remain in French

## Common Tasks

### Adding a New News Article
Edit `newsDatabase` in app.js:
```javascript
const newsDatabase = {
    geopolitics: [
        {
            id: unique_number,
            title: "Article title",
            source: "Source name",
            time: "Xh",
            category: "geopolitics",
            tags: ["tag1", "tag2"]
        }
    ]
}
```

### Adding a New Market Indicator
Edit `marketData` array in app.js and add corresponding HTML in index.html.

### Changing Color Scheme
Modify CSS variables in styles.css `:root` section.

### Adding a New Category
1. Add navigation link in HTML
2. Add section in HTML
3. Add category to `newsDatabase` in app.js
4. Update `loadNews()` function to handle new category

## Performance Considerations

- Market data updates every 10 seconds (avoid shorter intervals)
- News refresh every 60 seconds
- Use CSS transforms for animations (better performance)
- Images should be optimized if added
- Keep JavaScript execution minimal on scroll

## Known Limitations

1. **Simulated Data**: Market prices are random simulations, not real API data
2. **Static News**: Articles are hardcoded, not fetched from RSS/APIs
3. **No Persistence**: User preferences/favorites not saved
4. **CORS**: Direct API calls would fail; needs backend proxy for real data
5. **No Authentication**: Public, read-only access only

## Future Enhancement Areas

### Near-term (No breaking changes)
- Real API integration (CoinGecko, Alpha Vantage)
- Search and filter functionality
- Light/dark mode toggle
- Interactive charts (Chart.js or similar)
- RSS feed integration

### Long-term (Architectural changes)
- Backend service for API proxying
- User authentication and favorites
- WebSocket for real-time data
- Progressive Web App (PWA) features
- Multi-language support (English version)

## Deployment

The site is designed for static hosting:
- GitHub Pages
- Netlify
- Vercel
- Any static file server

No server-side processing required. Simply serve the files as-is.

## Testing Approach

Since there's no testing framework:
- Manual testing across browsers (Chrome, Firefox, Safari)
- Responsive testing using browser dev tools
- Check all navigation links work
- Verify market data updates
- Ensure animations are smooth
- Test on actual mobile devices

## Git Branch Strategy

- Main branch: Production-ready code
- Feature branches: Named `claude/feature-name-sessionId`
- Always develop on feature branches
- Create PRs for review before merging

## Notes for AI Assistants

When working on this project:
- Always read files before modifying them
- Preserve the French language in all user-facing content
- Maintain the dark, professional aesthetic
- Keep the codebase simple - no over-engineering
- Test responsive design when making layout changes
- Update this CLAUDE.MD if you make architectural changes
- Respect the "no frameworks" constraint
- Consider performance impact of any changes

## Key Source Locations

News sources referenced in README.md:
- International: Reuters, Bloomberg, FT, BBC, Al Jazeera, CNBC, MarketWatch
- French: Le Monde, Les Échos
- Crypto: CoinDesk, Cointelegraph, The Block
- Investment: Morningstar, ETF.com

---

*This file helps AI assistants understand the project context and make better decisions when assisting with development.*
