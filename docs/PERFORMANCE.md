# Performance Guidelines

Tally should feel "fast and calm" - quick loads, instant feedback, and smooth interactions.

## Performance Budgets

| Metric | Target | Critical |
|--------|--------|----------|
| **First Contentful Paint** | < 1.5s | < 2.0s |
| **Largest Contentful Paint** | < 2.5s | < 3.0s |
| **Cumulative Layout Shift** | < 0.05 | < 0.1 |
| **Total Blocking Time** | < 200ms | < 300ms |
| **Time to Interactive** | < 3.5s | < 4.0s |
| **Total JS Bundle** | < 400 KB | < 500 KB |
| **Lighthouse Performance** | > 90 | > 80 |

## CI Checks

Performance is checked on every PR via `.github/workflows/performance.yml`:

1. **Lighthouse CI** - Runs against built app, reports scores
2. **Bundle Analysis** - Reports JS bundle sizes

Currently non-blocking (warnings only) to establish baselines.

## Best Practices

### Loading States

Prefer skeletons over spinners for perceived performance:

```tsx
// ❌ Spinner blocks UI
{isLoading && <Spinner />}

// ✅ Skeleton shows structure
{isLoading && <ChallengeSkeleton />}
```

### Optimistic Updates

For entry creation, update UI immediately:

```tsx
// ❌ Wait for server
const result = await createEntry(data);
setEntries([...entries, result]);

// ✅ Optimistic update
setEntries([...entries, optimisticEntry]);
const result = await createEntry(data);
// Update with real ID if needed
```

### Data Fetching

Avoid waterfalls - fetch in parallel:

```tsx
// ❌ Sequential fetches
const challenges = await getChallenges();
const entries = await getEntries(challenges[0].id);

// ✅ Parallel fetches
const [challenges, entries] = await Promise.all([
  getChallenges(),
  getEntriesForToday(),
]);
```

### Pagination

Never load unbounded data:

```tsx
// ❌ Load all entries
const entries = await listAllEntries();

// ✅ Paginate or filter
const entries = await listEntriesByDateRange(startDate, endDate);
```

### Bundle Size

Keep chunks under 200 KB:

- Use dynamic imports for heavy components
- Avoid importing entire libraries (`import { specific } from 'lib'`)
- Check bundle impact before adding dependencies

```tsx
// ❌ Loads entire library
import _ from 'lodash';

// ✅ Tree-shakeable import
import debounce from 'lodash/debounce';

// ✅ Dynamic import for heavy components
const Chart = dynamic(() => import('./Chart'), {
  loading: () => <ChartSkeleton />,
});
```

### Images

Use Next.js Image component for automatic optimization:

```tsx
import Image from 'next/image';

// ✅ Automatic optimization
<Image 
  src="/hero.png" 
  width={800} 
  height={600} 
  alt="Hero" 
  priority // for above-fold images
/>
```

### Convex Subscriptions

Be selective with real-time data:

```tsx
// ❌ Subscribe to all challenges
const challenges = useQuery(api.challenges.list);

// ✅ Subscribe only to active challenges
const challenges = useQuery(api.challenges.listActive);
```

## Measuring Performance

### Local Development

```bash
cd tally-web

# Build and analyze
ANALYZE=true bun run build

# Run Lighthouse locally
bunx lighthouse http://localhost:3000 --output html --output-path ./lighthouse.html
```

### Production

Use Web Vitals reporting (already configured in the app):

1. Check Vercel Analytics dashboard
2. Review Sentry Performance tab
3. Monitor Core Web Vitals in Search Console

## Troubleshooting

### Large Bundle

1. Run `ANALYZE=true bun run build`
2. Check `.next/analyze/` for bundle visualization
3. Identify large dependencies
4. Consider dynamic imports or alternatives

### Slow LCP

1. Check for render-blocking resources
2. Preload critical assets
3. Use `priority` prop on above-fold images
4. Avoid client-side data fetching for initial content

### Layout Shift

1. Set explicit dimensions on images/videos
2. Reserve space for dynamic content
3. Avoid inserting content above existing content
4. Use skeleton loaders that match final dimensions
