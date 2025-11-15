# QA Checklist

Comprehensive quality assurance checklist for PubsInBangalore directory before launch.

## Performance

### Lighthouse Scores
- [ ] Performance score: ≥ 90
- [ ] Accessibility score: ≥ 95
- [ ] Best Practices score: ≥ 90
- [ ] SEO score: ≥ 95

### Core Web Vitals
- [ ] Largest Contentful Paint (LCP): < 2.5s
- [ ] First Input Delay (FID): < 100ms
- [ ] Cumulative Layout Shift (CLS): < 0.1
- [ ] First Contentful Paint (FCP): < 1.8s
- [ ] Time to Interactive (TTI): < 3.8s

### Page Load Times
- [ ] Homepage loads in < 2s on 3G connection
- [ ] Locality pages load in < 2.5s on 3G connection
- [ ] Pub detail pages load in < 3s on 3G connection
- [ ] Admin dashboard loads in < 2s

### Optimization
- [ ] Images are optimized (WebP format, proper sizing)
- [ ] CSS is minified and critical CSS is inlined
- [ ] JavaScript bundles are code-split appropriately
- [ ] Fonts are preloaded
- [ ] API responses are cached appropriately
- [ ] Database queries are optimized (no N+1 queries)

## Accessibility

### WCAG 2.1 AA Compliance
- [ ] All images have alt text
- [ ] Form inputs have associated labels
- [ ] Color contrast meets WCAG AA standards (4.5:1 for text)
- [ ] Focus indicators are visible on all interactive elements
- [ ] Page structure uses semantic HTML (header, nav, main, footer)
- [ ] Headings are properly nested (h1 → h2 → h3)

### Keyboard Navigation
- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical
- [ ] Skip links are available for main content
- [ ] Modal dialogs trap focus
- [ ] Escape key closes modals/dropdowns

### Screen Reader Testing
- [ ] Tested with NVDA (Windows) or VoiceOver (Mac)
- [ ] All content is announced correctly
- [ ] Form errors are announced
- [ ] Dynamic content changes are announced
- [ ] ARIA labels are used where appropriate

## Data Accuracy

### Sample Data Verification
- [ ] Random sample of 10 pubs verified for accuracy:
  - [ ] Name matches source
  - [ ] Address/location is correct
  - [ ] Phone numbers are valid format
  - [ ] Website URLs are accessible
  - [ ] Google Maps links work correctly
  - [ ] Ratings match source data

### Broken Links
- [ ] All internal links work (no 404s)
- [ ] All external links are accessible
- [ ] Google Maps embeds load correctly
- [ ] No broken image links

### Missing Data
- [ ] No pubs with missing required fields (name, slug, google_maps_url)
- [ ] Missing optional fields are handled gracefully (show "Not specified" or similar)
- [ ] Empty states are user-friendly

## SEO

### Meta Tags
- [ ] All pages have unique title tags (≤ 60 characters)
- [ ] All pages have unique meta descriptions (150-160 characters)
- [ ] OpenGraph tags are present and correct
- [ ] Twitter Card tags are present and correct
- [ ] Canonical URLs are set correctly (no duplicates)

### Structured Data
- [ ] JSON-LD structured data validates with Google Rich Results Test
- [ ] BarOrPub schema is correct on pub detail pages
- [ ] FAQPage schema is correct (if FAQs exist)
- [ ] Organization schema is present on homepage
- [ ] BreadcrumbList schema is present (if breadcrumbs exist)

### Sitemap & Robots
- [ ] sitemap.xml is accessible at `/sitemap.xml`
- [ ] All public pages are included in sitemap
- [ ] robots.txt is accessible at `/robots.txt`
- [ ] robots.txt references sitemap.xml
- [ ] Admin routes are disallowed in robots.txt

### URL Structure
- [ ] URLs are clean and descriptive
- [ ] No query parameters in canonical URLs
- [ ] URLs use hyphens, not underscores
- [ ] No trailing slashes (or consistent trailing slashes)

## Browser Compatibility

### Desktop Browsers
- [ ] Chrome (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Safari (latest 2 versions)
- [ ] Edge (latest 2 versions)

### Mobile Browsers
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] Samsung Internet

### Responsive Design
- [ ] Mobile viewport (375px width) - all content readable
- [ ] Tablet viewport (768px width) - layout adapts correctly
- [ ] Desktop viewport (1920px width) - content doesn't stretch too wide
- [ ] Touch targets are at least 44x44px on mobile

## Functionality

### Search & Filters
- [ ] Search returns relevant results
- [ ] Filters work correctly (budget, wifi, valet, etc.)
- [ ] Filter combinations work together
- [ ] Clear/reset filters works
- [ ] Search works on locality pages

### Shareable Links
- [ ] Share section renders on all pub detail pages
- [ ] Copy message button works on desktop and mobile
- [ ] WhatsApp link opens with the prefilled message
- [ ] `navigator.share` fallback copies message when native share unavailable
- [ ] Message includes correct pub name, locality, and URL

### Badge System
- [ ] Badge generation form works
- [ ] Email verification link works
- [ ] Badge HTML code is correct
- [ ] Badge tracking endpoint works
- [ ] Badge displays correctly when embedded

### Admin Dashboard
- [ ] CSV upload works
- [ ] Manual pub updates work
- [ ] Claim processing works
- [ ] Community report processing works
- [ ] Change history is logged correctly

## Security

### Input Validation
- [ ] All form inputs are validated server-side
- [ ] SQL injection prevention (using parameterized queries)
- [ ] XSS prevention (content is escaped)
- [ ] CSRF protection on forms

### Authentication & Authorization
- [ ] Admin routes are protected (service role required)
- [ ] API endpoints validate permissions
- [ ] Sensitive data is not exposed in client-side code

### Environment Variables
- [ ] No secrets in client-side code
- [ ] Environment variables are properly configured
- [ ] Service role key is server-side only

## Monitoring & Analytics

### Google Analytics
- [ ] GA4 is installed and tracking page views
- [ ] Events are tracked (if applicable)
- [ ] No duplicate tracking codes

### Error Tracking
- [ ] Error tracking is configured (if applicable)
- [ ] 404 errors are handled gracefully
- [ ] 500 errors show user-friendly message

## Documentation

### Code Documentation
- [ ] README.md is up to date
- [ ] API endpoints are documented
- [ ] Environment variables are documented
- [ ] Database schema is documented

### User Documentation
- [ ] Badge generation process is documented
- [ ] Admin workflows are documented

## Pre-Launch Checklist

- [ ] All critical bugs are fixed
- [ ] Performance benchmarks are met
- [ ] Accessibility audit passed
- [ ] SEO audit passed
- [ ] Security review completed
- [ ] Backup and recovery plan is documented
- [ ] Monitoring and alerting is configured
- [ ] Launch playbook is reviewed

## Post-Launch Monitoring

- [ ] Monitor error rates for first 24 hours
- [ ] Check Google Search Console for crawl errors
- [ ] Monitor Core Web Vitals in Google Analytics
- [ ] Review user feedback and reports
- [ ] Check server logs for errors

