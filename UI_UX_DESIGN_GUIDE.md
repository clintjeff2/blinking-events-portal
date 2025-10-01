# Blinking Events UI/UX Design Guide

This design document sets the foundation for a consistent, premium, and highly usable visual experience across both the Blinking Events web portal (Next.js) and the mobile apps (React Native).  
**Copy this file into both codebases for reference and onboarding.**

---

## 1. Brand & Color System

### Brand Personality:
- **Premium**: Gold accents, elegant gradients, generous white space.
- **Energetic**: Vibrant red, animated elements, bold headings.
- **Welcoming**: Soft backgrounds, rounded corners, approachable typography.

### Core Brand Colors

| Name                  | Hex        | Usage Example                |
|-----------------------|------------|------------------------------|
| Blinking Red          | #E1262C    | Primary buttons, highlights  |
| Blinking Charcoal     | #1D1D1F    | Headings, background (dark)  |
| Blinking Gold         | #C8A64B    | Accents, icons, borders      |
| Blinking White        | #FFFFFF    | Main backgrounds, text       |
| Blinking Soft Gray    | #F5F5F7    | Cards, secondary backgrounds |

#### Extended Palette

- **Muted Gray:** #91959C (for disabled, muted text)
- **Accent Gold:** #F3E5AB (gradient, shimmer effects)

#### Color Roles

- `primary` = Blinking Red
- `secondary` = Blinking Soft Gray
- `accent` = Blinking Gold
- `background` = White (light mode) / Charcoal (dark mode)
- `foreground` = Charcoal (light) / White (dark)
- `border` = Blinking Soft Gray (light) / #2D2D30 (dark)
- `ring` = Blinking Gold (focus, active, selection)

**See the [CSS variables](#css-variables) section for mapping and implementation.**

---

## 2. Typography

- **Primary Sans-Serif**: Inter, system-ui, sans-serif
- **Headings/Accents**: Playfair Display or similar modern serif for premium feel
- **Mono (code, numbers)**: SFMono-Regular, Consolas, ui-monospace

#### Font Sizes (Mobile & Web)
- Heading 1: 2.5rem / 700
- Heading 2: 2rem / 600
- Heading 3: 1.5rem / 600
- Body Large: 1.125rem
- Body: 1rem
- Small: 0.875rem

#### Font Weights
- Headings: 600–700
- Body: 400–500

#### Letter Spacing
- Slightly increased for headings
- Normal for body

---

## 3. Spacing & Layout

- **Border radius**: 10px (0.625rem) for cards, buttons; can use 8px/12px variants for smaller/larger elements
- **Spacing scale**: 8/16/24/32/40px; mobile-first, generous padding for touch targets
- **Card padding**: 1.5rem
- **Section gaps**: 2rem+

---

## 4. UI Components & Patterns

### Cards

- Soft gray or white background
- Rounded corners, subtle shadow
- Gold accent line or decorator dot for premium feel

### Buttons

- **Primary**: Blinking Red bg, white text, gold ring on focus
- **Secondary**: Soft gray bg, charcoal text
- **Accent**: Gold bg, white text
- **Shape**: Rounded, medium radius, bold font

### Forms & Inputs

- White or soft gray backgrounds
- Blinking Gold ring on focus
- Rounded corners
- Clear, large labels
- Destructive (error): Red underline/ring

### Navigation

- **Web**: Top navbar (white or charcoal), sidebar for admin
- **Mobile**: Bottom tab (client), Drawer/side nav (admin/staff)
- Use gold highlight for active state
- Icons: Rounded, outlined, gold-accented

### Modals, Popovers & Tooltips

- Use backdrop blur, gold border or decorator line on top
- Rounded corners, moderate padding

### Media

- Use luxury gradients (gold) for overlays, shimmer for loading
- Portfolio/media cards: soft shadow, animated on hover/tap

---

## 5. Animations

- Subtle, premium-feeling transitions
- **Fade in up/down** for page/content load
- **Slide in left/right** for drawers/sidebars
- **Pulse** for notifications, new messages
- **Shimmer** for loading placeholders
- Use animation durations: 0.5–0.7s, cubic-bezier for premium feel

---

## 6. Accessibility

- **Color contrast**: All text must meet WCAG AA
- **Focus styles**: Gold ring, clear visible outlines
- **Tap targets**: 48px for mobile
- **Labels**: All icons & buttons have accessible labels

---

## 7. Dark Mode

- **Background**: Charcoal
- **Cards/Inputs**: #2D2D30 or similar
- **Text**: Mostly white, gold accents
- **Primary/Accent**: Remain unchanged
- Auto-detect OS theme if possible; toggle in settings

---

## 8. Decorative Elements

- **Gold gradient lines** under headings or as separators
- **Red glow** behind key icons/buttons for eventful feel
- **Luxury text**: Gold gradient for key phrases or titles
- **Decorator dot**: Red dot before important list items

---

## 9. Example Usage

```jsx
// Button (Web/React Native)
<Button
  style={{
    backgroundColor: "#E1262C",
    color: "#FFFFFF",
    borderRadius: 10,
    fontWeight: 600,
    padding: "1rem 2rem",
    boxShadow: "0 2px 8px rgba(225, 38, 44, 0.08)",
    border: "2px solid #C8A64B", // on focus
  }}
>
  Request Quote
</Button>
```

```jsx
// Card
<View
  style={{
    backgroundColor: "#F5F5F7",
    borderRadius: 10,
    padding: 24,
    shadowColor: "#C8A64B",
    shadowOpacity: 0.06,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#C8A64B",
  }}
>
  {/* Card content */}
</View>
```

---

## 10. CSS Variables

Use these variables in your stylesheets (web) or as a reference for React Native style constants.

```css
:root {
  --primary: #E1262C;
  --primary-foreground: #FFFFFF;
  --background: #FFFFFF;
  --foreground: #1D1D1F;
  --accent: #C8A64B;
  --secondary: #F5F5F7;
  --border: #F5F5F7;
  --ring: #C8A64B;
  --radius: 0.625rem;
  /* ...see CSS in your reference for full list */
}
.dark {
  --background: #1D1D1F;
  --foreground: #FFFFFF;
  --border: #2D2D30;
  --secondary: #2D2D30;
  /* ... */
}
```

---

## 11. Design System Principles

- **Consistency**: Always use the same color, spacing, font for the same function
- **Hierarchy**: Headings, buttons, and key actions stand out
- **Clarity**: Prefer clear, readable layouts over complex ones
- **Delight**: Animations and accents used sparingly for user delight

---

## 12. References

- **Color palette and component styles**: [See CSS variables from website]
- **Animations**: Use the provided keyframes and utility classes for both platforms.
- **Typography**: Use Inter or Playfair Display on web; for mobile, use system or Google Fonts.

---

**Keep this file in both the web and mobile codebases for easy reference while developing UI components.**