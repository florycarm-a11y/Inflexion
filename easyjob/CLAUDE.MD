# CLAUDE.MD - EasyJob Project Context

## Project Identity

**Project Name**: EasyJob
**Type**: Job Service Website
**Organization**: TBS Education (Toulouse Business School)
**Purpose**: Connect TBS students with employment opportunities
**Target Audience**:
- B2B: Companies seeking student talent
- B2C: TBS students seeking jobs

## Critical Distinction

⚠️ **IMPORTANT**: EasyJob is **NOT** a Junior Enterprise (Junior Conseil).

- ❌ NOT a consulting firm
- ❌ NOT providing services to clients
- ✅ Job service platform
- ✅ Recruitment facilitation
- ✅ Student-employer matchmaking

## Project Context

### Primary Stakeholder
- **Communication & Events Manager** of TBS Education student association
- Responsible for redesigning the brand and interface
- Focus on B2B outreach to companies for partnerships

### Business Model
- Solicit companies and economic agents
- Obtain partnership offers for:
  - Small jobs (petits boulots)
  - Fixed-term contracts (CDD)
  - Internships (stages)
  - Permanent contracts (CDI - if possible)

## Technical Architecture

### File Structure
```
easyjob/
├── index.html       # Main structure with semantic HTML5
├── styles.css       # Complete styling with TBS-inspired branding
├── app.js          # All interactions and business logic
├── README.md       # User-facing documentation
└── CLAUDE.MD       # This file - AI assistant context
```

### Technology Stack
- **HTML5**: Semantic markup, accessibility-first
- **CSS3**: Custom properties (CSS variables), Grid, Flexbox
- **JavaScript**: Pure vanilla JS (no frameworks, no dependencies)
- **Font**: Inter from Google Fonts
- **No build tools**: Static site, no bundlers

### Key Design Decisions

1. **Professional yet Dynamic**: Balance between corporate credibility (for B2B) and student appeal
2. **Mobile-First**: Responsive design prioritizing mobile experience
3. **TBS Branding**: Pink/Rose primary + Violet accent (Toulouse colors - Rose & Violette)
4. **Dual CTA Strategy**: "Je recrute" (I recruit) vs "Je cherche un job" (I'm looking for a job)
5. **No Backend Yet**: Static prototype with simulated data

## Page Structure

### 1. Navigation
- Sticky header with blur backdrop
- Desktop: Horizontal menu
- Mobile: Hamburger menu
- Active section detection via Intersection Observer

### 2. Hero Section
- Value proposition headline with gradient text
- Dual CTA buttons (recruitment vs job seeking)
- Animated statistics (500 students, 120 companies, 350 offers)

### 3. Entreprises Section (B2B Focus)
- 4 feature cards explaining benefits
- CTA box for partnership signup
- Professional tone emphasizing quality of TBS talents

### 4. Étudiants Section (B2C)
- 4 job category cards with emoji icons
- Benefits list with checkmarks
- Student testimonial card

### 5. Offres Section
- Filter buttons (All, Stages, CDD, CDI, Petits boulots)
- Dynamic job cards grid
- 9 sample jobs from major companies

### 6. Partenaires Section
- Company logos grid
- Social proof (Airbus, Decathlon, Capgemini, BNP Paribas, Carrefour, L'Oréal)

### 7. Contact Section
- Contact information (address, email, phone)
- Social media links (LinkedIn, Instagram)
- Job posting form

### 8. Footer
- Links, resources, contact
- TBS Education branding

## Data Structure

### Job Object Schema
```javascript
{
    id: number,           // Unique identifier
    company: string,      // Company name
    title: string,        // Job title
    type: string,         // "stage" | "cdd" | "cdi" | "petit-boulot"
    description: string,  // Full description
    location: string,     // City
    posted: string,       // Relative time (e.g., "Il y a 2h")
    badge: string         // Display badge (same as type)
}
```

### Current Jobs Database
9 sample jobs stored in `jobsDatabase` array in app.js:
- 3 stages (Airbus, L'Oréal, Deloitte)
- 2 CDD (BNP Paribas, Orange)
- 2 CDI (Capgemini, Sopra Steria)
- 2 petits boulots (Decathlon, Carrefour)

## CSS Architecture

### Design System
All design tokens defined as CSS custom properties in `:root`:
- Colors (primary, secondary, accent, system colors)
- Spacing scale (xs to 2xl)
- Typography scale (xs to 5xl)
- Border radius (sm to full)
- Shadows (sm to xl)
- Transitions (fast, base, slow)

### Component-Based Structure
1. **Utilities** - Container, text-center, gradient-text
2. **Navigation** - Sticky navbar, mobile menu
3. **Buttons** - Primary, secondary, large, block variants
4. **Sections** - Consistent spacing and alternating backgrounds
5. **Cards** - Feature, job, category, testimonial, stat cards
6. **Forms** - Styled inputs, selects, textareas
7. **Footer** - Multi-column layout

### Responsive Strategy
- Desktop: 3-4 column grids, horizontal navigation
- Tablet (< 1024px): 2 column grids, adjusted spacing
- Mobile (< 768px): Single column, hamburger menu, stacked elements

## JavaScript Functionality

### Core Features

1. **Navigation & Scroll**
   - `initNavigation()`: Intersection Observer for active section detection
   - `initMobileMenu()`: Hamburger menu toggle
   - `initSmoothScroll()`: Smooth anchor link scrolling
   - `initScrollEffects()`: Navbar shadow on scroll

2. **Statistics Animation**
   - `initStatsAnimation()`: Count-up animation on scroll into view
   - `animateValue()`: Incremental number animation

3. **Jobs Display**
   - `displayJobs()`: Render job cards dynamically
   - `createJobCard()`: Generate job card HTML
   - `showJobDetails()`: Modal/alert for job details (basic implementation)

4. **Filtering**
   - `initFilters()`: Setup filter button event listeners
   - `filterJobs()`: Filter jobs by type

5. **Form Handling**
   - `initForm()`: Setup form submit listener
   - `handleFormSubmit()`: Validate and process form
   - `showNotification()`: Display success/error messages
   - `isValidEmail()`: Email validation

### State Management
- No complex state management needed
- Data stored in `jobsDatabase` constant
- Current filter tracked via `.active` class on buttons

## Branding Guidelines

### Color Palette
```css
Primary (Rose):      #ec4899  /* Main brand color, CTAs, TBS Pink */
Primary Dark:        #db2777  /* Hover states, deeper pink */
Primary Light:       #f9a8d4  /* Badges, accents, light pink */
Secondary (Red):     #f43f5e  /* Secondary accent, soft red */
Accent (Violet):     #8b5cf6  /* Gradients, Toulouse Violette */
Success (Green):     #10b981  /* Positive feedback */
Warning (Amber):     #f59e0b  /* Alerts */
Danger (Red):        #ef4444  /* Errors */
```

### Typography
- **Family**: Inter (sans-serif, modern, professional)
- **Weights**: 300 (light), 400 (regular), 500 (medium), 600 (semi-bold), 700 (bold), 800 (extra-bold)
- **Scale**: Modular scale from 0.75rem to 3rem

### Visual Style
- **Shapes**: Rounded corners (0.375rem to 1rem)
- **Shadows**: Subtle to pronounced (4 levels)
- **Gradients**: Linear gradients from primary to accent
- **Animations**: Smooth, subtle (150-350ms duration)
- **Icons**: SVG line icons, 24px standard size

## Development Guidelines

### When Adding Content

**Adding a New Job**:
1. Edit `app.js` → `jobsDatabase` array
2. Follow the job object schema
3. Use appropriate type: "stage", "cdd", "cdi", or "petit-boulot"
4. Keep descriptions concise (2-3 sentences)

**Changing Statistics**:
1. Edit `index.html`
2. Find `.stat-number` elements
3. Update `data-target` attribute
4. Animation will handle the rest

**Updating Company Partners**:
1. Edit `index.html` → `.partners-grid`
2. Add/modify `.partner-logo` divs
3. Use company name as text (logos would require images)

### When Modifying Design

**Colors**:
- Always use CSS variables from `:root`
- Never hardcode color values
- Maintain AA accessibility contrast ratios

**Spacing**:
- Use spacing scale variables (--spacing-*)
- Maintain consistent rhythm

**Responsive**:
- Test at all breakpoints (480px, 768px, 1024px)
- Use Grid and Flexbox for layouts
- Avoid fixed widths

**Animations**:
- Keep under 350ms for responsiveness
- Use CSS transitions when possible
- JavaScript animations only for complex sequences

### Code Style

**HTML**:
- Semantic elements (header, nav, section, article, footer)
- Accessible (alt text, ARIA labels, form labels)
- BEM-inspired class naming

**CSS**:
- Mobile-first approach
- Component-based organization
- Utility classes for common patterns

**JavaScript**:
- ES6+ features
- Pure functions when possible
- Event delegation for performance
- Clear function names (verb-noun pattern)

## Known Limitations

1. **Static Data**: Jobs hardcoded in JavaScript
2. **No Backend**: Form doesn't actually send emails
3. **No Authentication**: No user accounts or login
4. **No Database**: No persistent storage
5. **No Search**: Only basic filtering by job type
6. **Basic Job Details**: Alert instead of proper modal
7. **No File Upload**: Can't attach CVs
8. **No Analytics**: No tracking of user behavior

## Future Enhancements

### Phase 2 (Backend Integration)
- [ ] Node.js/Express API
- [ ] PostgreSQL or MongoDB database
- [ ] Real form submission with email notifications
- [ ] Company and student authentication
- [ ] Admin dashboard for managing offers

### Phase 3 (Advanced Features)
- [ ] Full-text search across jobs
- [ ] Advanced filtering (location, salary, duration)
- [ ] Online application system
- [ ] CV builder/storage
- [ ] Email notifications for new matching jobs
- [ ] Company profiles with branding

### Phase 4 (Platform Evolution)
- [ ] AI-powered job matching
- [ ] Mobile application (React Native)
- [ ] Integration with TBS calendar for events
- [ ] Analytics dashboard for insights
- [ ] API for third-party integrations

## Deployment Considerations

### Static Hosting (Current State)
- GitHub Pages ready
- Netlify/Vercel compatible
- Any static file server works
- No server-side processing needed

### Future Production Requirements
- HTTPS mandatory
- Domain name (easyjob.tbs-education.fr suggested)
- Email service (SendGrid, Mailgun, etc.)
- Database hosting
- Backend server (Node.js on Heroku/AWS/DigitalOcean)
- RGPD compliance for student data
- CSRF protection on forms
- Rate limiting on API endpoints

## SEO & Accessibility

### Current State
- Semantic HTML structure ✅
- Meta description tag ✅
- Alt text on decorative SVGs ⚠️ (using inline SVGs, aria-labels where needed)
- Form labels properly associated ✅
- Keyboard navigation support ✅
- Color contrast (needs verification) ⚠️

### TODO for Production
- [ ] Verify WCAG 2.1 AA compliance
- [ ] Add comprehensive meta tags (Open Graph, Twitter Cards)
- [ ] Create sitemap.xml
- [ ] Add robots.txt
- [ ] Implement structured data (JSON-LD for JobPosting)
- [ ] Add language tags
- [ ] Test with screen readers
- [ ] Optimize images (when added)

## Testing Checklist

Before any release:
- [ ] Test on Chrome, Firefox, Safari, Edge
- [ ] Test on iOS (iPhone, iPad)
- [ ] Test on Android (various devices)
- [ ] Verify all links work
- [ ] Test form validation
- [ ] Test all filters
- [ ] Verify smooth scrolling
- [ ] Check mobile menu toggle
- [ ] Verify statistics animation
- [ ] Test job card click interactions
- [ ] Check responsive breakpoints
- [ ] Verify no console errors
- [ ] Test with slow network (3G simulation)

## AI Assistant Guidelines

When working on this project:

1. **Preserve the Purpose**: This is a job service, NOT a Junior Entreprise
2. **Maintain B2B Focus**: Companies are the primary target for outreach
3. **Keep It Simple**: No frameworks, no build tools, pure vanilla JS
4. **TBS Branding**: Respect the color scheme and professional tone
5. **French Language**: All user-facing content must be in French
6. **Mobile-First**: Always consider mobile experience first
7. **No Over-Engineering**: Avoid unnecessary complexity
8. **Data is Static**: Until backend is built, keep data in JavaScript
9. **Form is Demo**: Current form is a prototype, doesn't send real emails
10. **Update CLAUDE.MD**: Document any architectural changes here

## Contact Information

**TBS Education**
- Address: 20 Boulevard Lascrosses, 31000 Toulouse, France
- Phone: 05 61 29 49 49
- Email: contact@easyjob-tbs.fr (to be created)

**Social Media** (to be created)
- LinkedIn: TBD
- Instagram: TBD

---

*This CLAUDE.MD helps AI assistants understand the EasyJob project context, business requirements, and technical architecture for effective collaboration.*
