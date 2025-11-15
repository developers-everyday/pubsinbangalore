# Launch Playbook

Step-by-step guide for launching PubsInBangalore directory to production.

## Pre-Launch Checklist

### 1. Code & Infrastructure

- [ ] All Phase 4 tasks are complete
- [ ] Code is reviewed and merged to main branch
- [ ] All tests pass (if applicable)
- [ ] Build succeeds without errors
- [ ] No console errors or warnings in production build

### 2. Environment Setup

#### Supabase Production Project
- [ ] Production Supabase project is created
- [ ] Database schema is applied (`db/schema.sql`)
- [ ] Seed data is loaded (`db/seeds/*.sql`)
- [ ] RLS policies are verified
- [ ] Service role key is securely stored
- [ ] Anon key is configured in environment

#### Domain & DNS
- [ ] Domain name is purchased (e.g., pubsinbangalore.com)
- [ ] DNS records are configured:
  - [ ] A record or CNAME pointing to hosting provider
  - [ ] CAA records for SSL (if applicable)
- [ ] SSL certificate is configured (automatic with Vercel/Netlify)

#### Hosting Provider (Vercel recommended)
- [ ] Production project is created
- [ ] Git repository is connected
- [ ] Environment variables are configured:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `NEXT_PUBLIC_SITE_URL` (production URL)
  - [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID` (if using GA)
  - [ ] `RESEND_API_KEY` (if using Resend for emails)
- [ ] Build command: `npm run build`
- [ ] Output directory: `.next`
- [ ] Node.js version: 20.x

### 3. SEO & Analytics

#### Google Search Console
- [ ] Google Search Console account is created
- [ ] Property is verified (HTML file or meta tag)
- [ ] Sitemap is submitted: `https://pubsinbangalore.com/sitemap.xml`
- [ ] robots.txt is verified

#### Google Analytics
- [ ] GA4 property is created
- [ ] Measurement ID is configured in environment
- [ ] Real-time reporting is tested
- [ ] Goals/events are configured (if applicable)

### 4. Data Verification

- [ ] Sample of pubs are verified for accuracy
- [ ] All localities have at least one pub
- [ ] No duplicate pubs exist
- [ ] All required fields are populated
- [ ] Images load correctly (if applicable)

### 5. Security

- [ ] Service role key is not exposed in client-side code
- [ ] Environment variables are properly scoped
- [ ] Admin routes are protected
- [ ] Rate limiting is configured (if applicable)
- [ ] CORS is configured correctly

## Launch Day Steps

### Morning (Pre-Launch)

1. **Final Code Review**
   ```bash
   git checkout main
   git pull origin main
   npm run build
   npm run lint
   npm run typecheck
   npm run validate:schema
   ```

2. **Database Backup**
   - Create backup of production Supabase database
   - Document backup location and restore procedure

3. **Environment Verification**
   - Verify all environment variables are set correctly
   - Test database connection
   - Verify API endpoints are accessible

### Afternoon (Launch)

4. **Deploy to Production**
   - Push final code to main branch (if not already done)
   - Trigger deployment on hosting provider
   - Monitor build logs for errors
   - Wait for deployment to complete

5. **Smoke Tests**
   - [ ] Homepage loads correctly
   - [ ] Locality pages load correctly
   - [ ] Pub detail pages load correctly
   - [ ] Search functionality works
   - [ ] Badge generation form works
   - [ ] Admin dashboard is accessible (with service role)

6. **SEO Verification**
   - [ ] sitemap.xml is accessible: `https://pubsinbangalore.com/sitemap.xml`
   - [ ] robots.txt is accessible: `https://pubsinbangalore.com/robots.txt`
   - [ ] Canonical tags are present in page source
   - [ ] JSON-LD structured data validates with Google Rich Results Test

7. **Performance Check**
   - Run Lighthouse audit on homepage
   - Verify Core Web Vitals are within targets
   - Check page load times

### Evening (Post-Launch)

8. **Monitoring Setup**
   - [ ] Google Analytics is tracking page views
   - [ ] Error tracking is configured (if applicable)
   - [ ] Uptime monitoring is configured (if applicable)

9. **Search Console**
   - [ ] Submit sitemap in Google Search Console
   - [ ] Request indexing for homepage
   - [ ] Monitor for crawl errors

10. **Social Media & Announcement**
    - [ ] Announce launch on social media (if applicable)
    - [ ] Share with initial users/testers
    - [ ] Monitor for user feedback

## Post-Launch Monitoring (First 48 Hours)

### Hour 1
- [ ] Check error logs for any critical errors
- [ ] Verify Google Analytics is receiving data
- [ ] Test key user flows (search, view pub, share link)
- [ ] Monitor server response times

### Hour 6
- [ ] Review error logs again
- [ ] Check Google Search Console for crawl errors
- [ ] Confirm share links copy + WhatsApp flows still work
- [ ] Check database performance

### Hour 24
- [ ] Review Google Analytics data
- [ ] Check for any user-reported issues
- [ ] Verify sitemap is being crawled
- [ ] Review server logs for patterns

### Hour 48
- [ ] Full performance audit
- [ ] Review all monitoring dashboards
- [ ] Document any issues encountered
- [ ] Plan fixes for any critical issues

## Rollback Procedure

If critical issues are discovered:

1. **Immediate Rollback**
   ```bash
   # On hosting provider (Vercel example):
   # Use dashboard to revert to previous deployment
   # OR
   git revert <commit-hash>
   git push origin main
   ```

2. **Database Rollback** (if needed)
   - Restore from backup created pre-launch
   - Document what data was lost (if any)

3. **Communication**
   - Update status page (if applicable)
   - Communicate with users if service is affected

## Success Metrics

Track these metrics in the first week:

- **Traffic**
  - Unique visitors
  - Page views
  - Average session duration
  - Bounce rate

- **Performance**
  - Average page load time
  - Core Web Vitals scores
  - Error rate

- **SEO**
  - Pages indexed in Google
  - Search impressions
  - Click-through rate

- **Engagement**
  - Badge generation requests
  - Admin dashboard usage
  - Community reports submitted

## Common Issues & Solutions

### Issue: Build fails
**Solution:** Check build logs, verify all dependencies are installed, check Node.js version

### Issue: Database connection errors
**Solution:** Verify environment variables, check Supabase project status, verify RLS policies

### Issue: Sitemap not accessible
**Solution:** Verify sitemap.ts file exists, check Next.js routing, verify build output

### Issue: Badge emails not sending
**Solution:** Verify email service API key, check email service logs, verify email template

### Issue: Slow page loads
**Solution:** Check database query performance, verify caching is working, optimize images

## Support Contacts

- **Hosting Provider Support:** [Link to support]
- **Supabase Support:** [Link to support]
- **Email Service Support:** [Link to support]

## Notes

- Keep this playbook updated as procedures change
- Document any deviations from this playbook
- Review and update after each launch

