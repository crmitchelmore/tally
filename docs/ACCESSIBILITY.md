# Accessibility Guidelines

Tally should be usable by everyone, including users with disabilities.

## Standards

We target **WCAG 2.1 Level AA** compliance.

## Automated Checks

### ESLint (jsx-a11y)

The following a11y rules are enforced in `eslint.config.mjs`:

**Errors (must fix):**
- `alt-text` - Images must have alt text
- `aria-props` - Valid ARIA attributes
- `aria-role` - Valid ARIA roles
- `role-has-required-aria-props` - Roles have required properties
- `role-supports-aria-props` - Roles support their ARIA properties
- `tabindex-no-positive` - No positive tabindex

**Warnings (should fix):**
- `anchor-has-content` - Links have content
- `click-events-have-key-events` - Clickable elements keyboard accessible
- `heading-has-content` - Headings have content
- `html-has-lang` - HTML has lang attribute
- `interactive-supports-focus` - Interactive elements focusable
- `label-has-associated-control` - Labels associated with inputs
- `no-autofocus` - Avoid autofocus
- `no-static-element-interactions` - Static elements not interactive

### Lighthouse

Lighthouse accessibility audit runs on PRs (see `.github/workflows/performance.yml`).
Target: **Score > 90**

## Guidelines

### Keyboard Navigation

All interactive elements must be:
1. **Focusable** - Can reach with Tab key
2. **Operable** - Can activate with Enter/Space
3. **Visible** - Focus indicator is visible

```tsx
// ✅ Good: Button is keyboard accessible
<Button onClick={handleClick}>Save</Button>

// ❌ Bad: div is not keyboard accessible
<div onClick={handleClick}>Save</div>

// ✅ If you must use div, add keyboard support
<div 
  role="button" 
  tabIndex={0} 
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
  Save
</div>
```

### Focus Management

- Maintain logical focus order
- Return focus after dialogs close
- Skip links for navigation

```tsx
// Dialog focus management (handled by Radix)
<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    {/* Focus trapped in dialog */}
    {/* Returns to trigger on close */}
  </DialogContent>
</Dialog>
```

### Color & Contrast

- **Minimum contrast**: 4.5:1 for text, 3:1 for large text
- **Don't rely on color alone** - Use icons, patterns, or text
- **Test in high contrast mode**

```tsx
// ❌ Color alone indicates state
<span className={isError ? 'text-red-500' : ''}>
  Status
</span>

// ✅ Icon + color indicates state
<span className={isError ? 'text-red-500' : ''}>
  {isError && <AlertIcon />} Status
</span>
```

### Images & Icons

- All images need alt text
- Decorative images: `alt=""`
- Informative icons: add `aria-label`

```tsx
// Informative image
<Image src="/chart.png" alt="Progress chart showing 75% completion" />

// Decorative image
<Image src="/decoration.svg" alt="" aria-hidden="true" />

// Icon with meaning
<Button>
  <TrashIcon aria-hidden="true" />
  <span className="sr-only">Delete entry</span>
</Button>

// Icon button
<Button aria-label="Delete entry">
  <TrashIcon aria-hidden="true" />
</Button>
```

### Forms

- Labels for all inputs
- Error messages linked to inputs
- Required fields indicated

```tsx
<div>
  <Label htmlFor="challenge-name">
    Challenge Name <span aria-label="required">*</span>
  </Label>
  <Input 
    id="challenge-name"
    aria-required="true"
    aria-invalid={!!error}
    aria-describedby={error ? "name-error" : undefined}
  />
  {error && (
    <p id="name-error" role="alert" className="text-red-500">
      {error}
    </p>
  )}
</div>
```

### Motion & Animation

- Respect `prefers-reduced-motion`
- Avoid flashing content
- Provide pause controls for auto-playing content

```tsx
// In Tailwind/CSS
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

// In Framer Motion
const motionConfig = {
  transition: { 
    duration: prefersReducedMotion ? 0 : 0.3 
  }
};
```

### Screen Readers

- Use semantic HTML (`<main>`, `<nav>`, `<article>`)
- Announce dynamic content with live regions
- Hide decorative content

```tsx
// Announce loading state
<div aria-live="polite" aria-busy={isLoading}>
  {isLoading ? 'Loading...' : 'Content loaded'}
</div>

// Announce form submission
{submitted && (
  <div role="status" aria-live="polite">
    Entry saved successfully!
  </div>
)}
```

## Testing

### Manual Checklist

Before release, test:

- [ ] Tab through entire page - logical order?
- [ ] Activate all buttons/links with keyboard
- [ ] Screen reader announces content correctly
- [ ] Works at 200% zoom
- [ ] Works in high contrast mode
- [ ] Color not sole indicator of meaning
- [ ] Form errors announced and linked

### Tools

- **axe DevTools** - Browser extension for a11y audit
- **WAVE** - Web accessibility evaluation
- **VoiceOver** (Mac) / **NVDA** (Windows) - Screen reader testing
- **Contrast checker** - Verify color contrast

### Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Radix Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
