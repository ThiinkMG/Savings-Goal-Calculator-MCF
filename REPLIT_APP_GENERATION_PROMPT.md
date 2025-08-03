# Replit App Generation Prompt - My College Finance Branding

## 🎯 Project Brief
Create a [YOUR_APP_PURPOSE] using the **My College Finance** brand identity and design system. The app should maintain the same professional, educational aesthetic with a focus on financial empowerment for college students.

---

## 🏷️ Brand Identity

**Brand Name:** My College Finance  
**Tagline:** "EDUCATE • MOTIVATE • ELEVATE"  
**Mission:** Empowering students with financial education and smart tools for a brighter future  
**Website:** https://www.mycollegefinance.com/  

**Brand Personality:**
- Professional yet approachable
- Educational and motivational
- Student-focused
- Technology-forward
- Trustworthy and reliable

---

## 🎨 Visual Design System

### Color Palette - "Space Dust Theme"
Implement these exact colors using CSS custom properties:

```css
:root {
  /* Primary Brand Colors */
  --brand-blue: hsl(218, 99%, 30%);    /* #012699 - Space Dust */
  --brand-green: hsl(115, 93%, 47%);   /* #26e011 - Monstrous Green */
  --brand-amber: hsl(45, 98%, 50%);    /* #fdc003 - Marigold */
  --brand-black: hsl(235, 95%, 4%);    /* #000516 - Black Knight */
  
  /* Light Mode Theme */
  --background: hsl(0, 0%, 98%);
  --foreground: hsl(224, 71%, 4%);
  --primary: hsl(224, 100%, 54%);
  --border: hsl(220, 13%, 91%);
  --card: hsl(0, 0%, 100%);
  --muted: hsl(220, 14%, 96%);
  --muted-foreground: hsl(220, 9%, 46%);
}

.dark {
  /* Dark Mode Variants */
  --background: hsl(224, 71%, 4%);
  --foreground: hsl(210, 40%, 98%);
  --primary: hsl(234, 79%, 56%);
  --border: hsl(215, 27%, 32%);
  --card: hsl(224, 71%, 4%);
  --muted: hsl(223, 47%, 11%);
  --muted-foreground: hsl(215, 20%, 65%);
}
```

### Typography
- **Font Stack:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Brand Name:** `font-black` weight, brand-blue color
- **Tagline:** Small text, muted foreground color
- **Body:** Clean, readable fonts with proper hierarchy

---

## 🏗️ Required Components

### 1. Header Component
Create a sticky header with:
- **Logo:** Circular/round logo (use placeholder owl icon if needed)
- **Brand Name:** "MY COLLEGE FINANCE" in bold brand-blue
- **Tagline:** "EDUCATE • MOTIVATE • ELEVATE" in small muted text
- **Link:** Entire logo/brand area should link to https://www.mycollegefinance.com/
- **Actions:** Settings icon and theme toggle (sun/moon icons)
- **Styling:** Backdrop blur, border bottom, max-width container

```jsx
// Header structure example
<header className="sticky top-0 z-50 backdrop-blur-sm bg-background/80 border-b border-border">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center h-16">
      <a href="https://www.mycollegefinance.com/" className="flex items-center space-x-3">
        {/* Logo + Brand Text */}
      </a>
      <div className="flex items-center space-x-2">
        {/* Settings & Theme Toggle */}
      </div>
    </div>
  </div>
</header>
```

### 2. Footer Component
Create a footer with:
- **Background:** Dark gradient (`from-gray-900 to-black`)
- **Logo & Brand Name:** Centered layout
- **Description:** "Empowering students with financial education and smart tools for a brighter future"
- **Links:** Privacy Policy, Terms of Service, Follow Us (linktr.ee)
- **Tagline:** "Educate • Motivate • Elevate" in brand colors
- **Copyright:** "© 2025 My College Finance, LLC. All rights reserved"

### 3. Theme System
Implement light/dark mode with:
- **Toggle Button:** Sun/moon icons with smooth rotation animations
- **CSS Variables:** Use the provided color system
- **Transitions:** 300ms duration for smooth theme switching
- **Persistence:** Save theme preference to localStorage

---

## 🎨 Styling Patterns

### Card Components
```css
.card-component {
  @apply bg-card border-2 border-border rounded-xl p-4 transition-all duration-300;
}

.card-component:hover {
  @apply border-brand-blue shadow-lg -translate-y-1;
}

.card-selected {
  @apply border-brand-blue bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-950/20;
}
```

### Button Patterns
- **Primary:** Brand-blue background
- **Secondary:** Muted colors
- **Success:** Brand-green
- **Warning:** Brand-amber
- **Variants:** outline, ghost, solid

### Form Elements
- **Border Radius:** 0.5rem consistently
- **Dark Mode:** Darker input backgrounds with proper contrast
- **Focus States:** Brand-blue borders with subtle shadows

---

## 🎭 Animations & Interactions

Include these CSS animations:
```css
@keyframes slideIn {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes bounce-soft {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}
```

Apply to:
- Entry animations for components
- Hover effects on interactive elements
- Theme toggle animations
- Logo gentle bounce effect

---

## 📱 Responsive Design Requirements

### Mobile-First Approach
- **Breakpoints:** sm: 640px, md: 768px, lg: 1024px, xl: 1280px
- **Layout:** Stack elements vertically on mobile
- **Touch Targets:** Minimum 44px for buttons
- **Typography:** Responsive text sizes
- **Spacing:** Consistent padding and margins

### Container Patterns
```css
.container-pattern {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
}
```

---

## 🔗 Brand Links Integration

### Required External Links
- **Main Website:** https://www.mycollegefinance.com/
- **Privacy Policy:** https://www.mycollegefinance.com/privacy-policy
- **Terms of Service:** https://www.mycollegefinance.com/terms-policy
- **Social Media:** https://linktr.ee/mycollegefinance

### Link Styling
```css
.brand-link {
  @apply hover:text-brand-blue transition-colors duration-300 hover:underline;
}
```

---

## 🛠️ Technical Implementation

### Required Dependencies
- **UI Framework:** React with TypeScript
- **Styling:** Tailwind CSS with CSS custom properties
- **Icons:** Lucide React (Sun, Moon, Settings, etc.)
- **Components:** Radix UI or similar for accessibility

### File Structure
```
src/
├── components/
│   ├── ui/           # Base UI components
│   ├── Header.tsx    # Brand header
│   ├── Footer.tsx    # Brand footer
│   ├── Logo.tsx      # Logo component
│   └── ThemeToggle.tsx
├── contexts/
│   └── ThemeContext.tsx
├── styles/
│   └── globals.css   # Brand color system
└── [your-app-files]
```

---

## ✅ Brand Consistency Checklist

### Visual Elements
- [ ] Space Dust color palette implemented
- [ ] Brand-blue used for primary elements
- [ ] Brand-green for success states
- [ ] Circular logo with proper sizing
- [ ] Consistent 0.5rem border radius
- [ ] Proper light/dark mode variants

### Typography
- [ ] Brand name in font-black weight
- [ ] Tagline "EDUCATE • MOTIVATE • ELEVATE"
- [ ] Consistent font hierarchy
- [ ] Proper contrast ratios

### Layout
- [ ] Sticky header with backdrop blur
- [ ] Dark gradient footer
- [ ] Responsive mobile-first design
- [ ] Consistent container max-widths

### Interactions
- [ ] 300ms transitions everywhere
- [ ] Hover effects on interactive elements
- [ ] Smooth theme toggle
- [ ] Gentle animations

### Links & Branding
- [ ] Main website link in header
- [ ] Footer links properly configured
- [ ] Mission statement included
- [ ] Copyright notice current

---

## 🎯 Content Guidelines

### Brand Voice
- **Educational:** Focus on learning and growth
- **Motivational:** Encourage financial responsibility
- **Professional:** Maintain credibility and trust
- **Student-Centered:** Speak to college-age audience

### Messaging Examples
- **Descriptions:** "Empowering students with financial education and smart tools for a brighter future"
- **CTAs:** "Start Your Journey," "Learn More," "Get Started"
- **Success Messages:** "Great job!", "You're on track!", "Achievement unlocked!"

---

## 📝 Implementation Instructions

1. **Setup:** Start with the color system in CSS custom properties
2. **Components:** Build Header and Footer first to establish brand presence
3. **Theme:** Implement light/dark mode with smooth transitions
4. **Layout:** Use the responsive container patterns
5. **Styling:** Apply the card and button patterns consistently
6. **Links:** Integrate all external brand links
7. **Testing:** Verify brand consistency across all breakpoints and themes

This brand system should create a cohesive experience that feels professional, educational, and specifically designed for college students managing their finances.