# MCF Brand Handoff Ready Document (HTML)
## My College Finance - Complete Brand Identity for Traditional HTML Applications

### 📋 Quick Implementation Summary
This document provides all branding elements from My College Finance app for direct implementation in traditional HTML/CSS applications. All code snippets are ready for copy-paste integration.

---

## 🎨 1. COLOR SYSTEM

### Complete CSS Variables Implementation
```css
/* Add this to your main CSS file */
:root {
  /* Primary Brand Colors - Space Dust Theme */
  --mcf-brand-blue: #012699;
  --mcf-brand-green: #26e011;
  --mcf-brand-amber: #fdc003;
  --mcf-brand-black: #000516;
  
  /* Light Mode Color Scheme */
  --mcf-background: #fafafa;
  --mcf-foreground: #09090b;
  --mcf-card: #ffffff;
  --mcf-card-foreground: #09090b;
  --mcf-popover: #ffffff;
  --mcf-popover-foreground: #09090b;
  --mcf-primary: #336bff;
  --mcf-primary-foreground: #f8fafc;
  --mcf-secondary: #f1f5f9;
  --mcf-secondary-foreground: #64748b;
  --mcf-muted: #f1f5f9;
  --mcf-muted-foreground: #64748b;
  --mcf-accent: #f1f5f9;
  --mcf-accent-foreground: #64748b;
  --mcf-destructive: #ef4444;
  --mcf-destructive-foreground: #f8fafc;
  --mcf-border: #e2e8f0;
  --mcf-input: #e2e8f0;
  --mcf-ring: #09090b;
  --mcf-radius: 0.5rem;
  
  /* Transitions */
  --mcf-transition: all 0.3s ease;
}

/* Dark Mode Color Scheme */
body.dark-mode {
  --mcf-background: #09090b;
  --mcf-foreground: #f8fafc;
  --mcf-card: #09090b;
  --mcf-card-foreground: #f8fafc;
  --mcf-popover: #09090b;
  --mcf-popover-foreground: #f8fafc;
  --mcf-primary: #4c6ef5;
  --mcf-primary-foreground: #f8fafc;
  --mcf-secondary: #374151;
  --mcf-secondary-foreground: #f8fafc;
  --mcf-muted: #1c1917;
  --mcf-muted-foreground: #94a3b8;
  --mcf-accent: #374151;
  --mcf-accent-foreground: #f8fafc;
  --mcf-destructive: #991b1b;
  --mcf-destructive-foreground: #f8fafc;
  --mcf-border: #374151;
  --mcf-input: #1f2937;
  --mcf-ring: #d1d5db;
  
  /* Brand colors adjustment for dark mode */
  --mcf-brand-blue: #0139cc;
  --mcf-brand-green: #3ae826;
  --mcf-brand-amber: #fdc922;
  --mcf-brand-black: #f0f1ff;
}
```

### Color Palette Reference
| Color Name | Light Mode | Dark Mode | Use Case |
|------------|------------|-----------|----------|
| Brand Blue | `#012699` | `#0139cc` | Primary actions, links, focus states |
| Brand Green | `#26e011` | `#3ae826` | Success states, progress, positive feedback |
| Brand Amber | `#fdc003` | `#fdc922` | Warnings, special highlights, graduation cap accent |
| Brand Black | `#000516` | `#f0f1ff` | Dark backgrounds, text on light |
| Background | `#fafafa` | `#09090b` | Main page background |
| Foreground | `#09090b` | `#f8fafc` | Primary text color |
| Primary | `#336bff` | `#4c6ef5` | Primary buttons, active states |
| Destructive | `#ef4444` | `#991b1b` | Error states, delete actions |

---

## 🔤 2. TYPOGRAPHY SYSTEM

### Font Stack Implementation
```css
/* Primary Font Stack - System Font Approach */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
               'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 
               'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 
               'Noto Color Emoji';
  font-size: 16px;
  line-height: 1.5;
  font-weight: 400;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### Typography Scale
```css
/* Heading Styles */
.mcf-h1 {
  font-size: 2.25rem; /* 36px */
  font-weight: 900;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.mcf-h2 {
  font-size: 1.875rem; /* 30px */
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.01em;
}

.mcf-h3 {
  font-size: 1.5rem; /* 24px */
  font-weight: 600;
  line-height: 1.3;
}

.mcf-h4 {
  font-size: 1.25rem; /* 20px */
  font-weight: 600;
  line-height: 1.4;
}

/* Body Text Styles */
.mcf-body-large {
  font-size: 1.125rem; /* 18px */
  font-weight: 400;
  line-height: 1.6;
}

.mcf-body {
  font-size: 1rem; /* 16px */
  font-weight: 400;
  line-height: 1.5;
}

.mcf-body-small {
  font-size: 0.875rem; /* 14px */
  font-weight: 400;
  line-height: 1.5;
}

.mcf-caption {
  font-size: 0.75rem; /* 12px */
  font-weight: 400;
  line-height: 1.4;
  color: var(--mcf-muted-foreground);
}

/* Brand Typography */
.mcf-brand-name {
  font-size: 1.25rem; /* 20px */
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--mcf-brand-blue);
}

.mcf-tagline {
  font-size: 0.75rem; /* 12px */
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--mcf-muted-foreground);
}
```

---

## 🦉 3. LOGO & VISUAL ASSETS

### SVG Logo Implementation (Owl with Graduation Cap)
```html
<!-- Inline SVG Logo - Scalable and Customizable -->
<svg class="mcf-logo" width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="48" fill="#012699"/>
  
  <!-- Owl Body -->
  <ellipse cx="50" cy="65" rx="25" ry="30" fill="white"/>
  
  <!-- Owl Head -->
  <circle cx="50" cy="40" r="22" fill="white"/>
  
  <!-- Eyes -->
  <circle cx="42" cy="35" r="8" fill="#012699"/>
  <circle cx="58" cy="35" r="8" fill="#012699"/>
  <circle cx="42" cy="35" r="4" fill="white"/>
  <circle cx="58" cy="35" r="4" fill="white"/>
  <circle cx="43" cy="33" r="2" fill="black"/>
  <circle cx="59" cy="33" r="2" fill="black"/>
  
  <!-- Beak -->
  <polygon points="50,42 47,48 53,48" fill="#fdc003"/>
  
  <!-- Ear Tufts -->
  <polygon points="32,20 38,35 28,35" fill="#012699"/>
  <polygon points="68,20 72,35 62,35" fill="#012699"/>
  
  <!-- Graduation Cap -->
  <rect x="35" y="15" width="30" height="4" fill="black"/>
  <polygon points="50,15 40,10 60,10" fill="black"/>
  <circle cx="65" cy="12" r="2" fill="#fdc003"/>
  
  <!-- Wing Details -->
  <ellipse cx="35" cy="55" rx="8" ry="15" fill="#012699" opacity="0.2"/>
  <ellipse cx="65" cy="55" rx="8" ry="15" fill="#012699" opacity="0.2"/>
</svg>

<!-- CSS for Logo Sizing -->
<style>
.mcf-logo {
  width: 60px;
  height: 60px;
}

.mcf-logo-small {
  width: 40px;
  height: 40px;
}

.mcf-logo-large {
  width: 80px;
  height: 80px;
}

@media (min-width: 640px) {
  .mcf-logo {
    width: 70px;
    height: 70px;
  }
}
</style>
```

### Logo Usage Guidelines
- **Minimum Size**: 40px × 40px
- **Clear Space**: Maintain minimum clear space equal to 25% of logo height on all sides
- **Background**: Works on both light and dark backgrounds
- **Modifications**: Do not stretch, skew, or alter proportions

---

## 🎨 4. COMPONENT STYLES

### Button Styles
```css
/* Base Button */
.mcf-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: var(--mcf-radius);
  transition: var(--mcf-transition);
  cursor: pointer;
  border: none;
  outline: none;
  text-decoration: none;
}

/* Primary Button */
.mcf-btn-primary {
  background-color: var(--mcf-primary);
  color: var(--mcf-primary-foreground);
}

.mcf-btn-primary:hover {
  background-color: var(--mcf-brand-blue);
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

/* Secondary Button */
.mcf-btn-secondary {
  background-color: var(--mcf-secondary);
  color: var(--mcf-secondary-foreground);
}

.mcf-btn-secondary:hover {
  background-color: var(--mcf-accent);
}

/* Outline Button */
.mcf-btn-outline {
  background-color: transparent;
  border: 2px solid var(--mcf-border);
  color: var(--mcf-foreground);
}

.mcf-btn-outline:hover {
  border-color: var(--mcf-primary);
  background-color: rgba(51, 107, 255, 0.05);
}

/* Destructive Button */
.mcf-btn-destructive {
  background-color: var(--mcf-destructive);
  color: var(--mcf-destructive-foreground);
}

.mcf-btn-destructive:hover {
  background-color: #dc2626;
}

/* Button Sizes */
.mcf-btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
}

.mcf-btn-lg {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}
```

### Card Component
```css
.mcf-card {
  background-color: var(--mcf-card);
  border: 2px solid var(--mcf-border);
  border-radius: calc(var(--mcf-radius) * 1.5);
  padding: 1.5rem;
  transition: var(--mcf-transition);
}

.mcf-card:hover {
  border-color: var(--mcf-brand-blue);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
}

.mcf-card-selected {
  border-color: var(--mcf-brand-blue);
  background: linear-gradient(135deg, rgba(1, 38, 153, 0.05) 0%, transparent 100%);
}

.mcf-card-header {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--mcf-border);
}

.mcf-card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--mcf-foreground);
  margin: 0;
}

.mcf-card-description {
  font-size: 0.875rem;
  color: var(--mcf-muted-foreground);
  margin-top: 0.25rem;
}

.mcf-card-content {
  color: var(--mcf-card-foreground);
}

.mcf-card-footer {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--mcf-border);
}
```

### Form Elements
```css
/* Input Fields */
.mcf-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  background-color: var(--mcf-background);
  color: var(--mcf-foreground);
  border: 2px solid var(--mcf-input);
  border-radius: var(--mcf-radius);
  transition: var(--mcf-transition);
}

.mcf-input:focus {
  outline: none;
  border-color: var(--mcf-primary);
  box-shadow: 0 0 0 3px rgba(51, 107, 255, 0.1);
}

.mcf-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Label */
.mcf-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--mcf-foreground);
  margin-bottom: 0.5rem;
}

/* Select Dropdown */
.mcf-select {
  width: 100%;
  padding: 0.5rem 2rem 0.5rem 0.75rem;
  font-size: 0.875rem;
  background-color: var(--mcf-background);
  color: var(--mcf-foreground);
  border: 2px solid var(--mcf-input);
  border-radius: var(--mcf-radius);
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  transition: var(--mcf-transition);
}

.mcf-select:focus {
  outline: none;
  border-color: var(--mcf-primary);
  box-shadow: 0 0 0 3px rgba(51, 107, 255, 0.1);
}

/* Checkbox */
.mcf-checkbox {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--mcf-input);
  border-radius: calc(var(--mcf-radius) * 0.5);
  appearance: none;
  cursor: pointer;
  transition: var(--mcf-transition);
  position: relative;
}

.mcf-checkbox:checked {
  background-color: var(--mcf-primary);
  border-color: var(--mcf-primary);
}

.mcf-checkbox:checked::after {
  content: "✓";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
}
```

---

## 🌙 5. DARK MODE IMPLEMENTATION

### JavaScript Toggle Implementation
```javascript
// Dark Mode Toggle Functionality
function initDarkMode() {
  // Check for saved preference or default to light mode
  const currentTheme = localStorage.getItem('mcf-theme') || 'light';
  
  if (currentTheme === 'dark') {
    document.body.classList.add('dark-mode');
  }
  
  // Toggle function
  const toggleDarkMode = () => {
    document.body.classList.toggle('dark-mode');
    const theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    localStorage.setItem('mcf-theme', theme);
  };
  
  // Attach to toggle button
  const toggleBtn = document.getElementById('mcf-theme-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleDarkMode);
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initDarkMode);
```

### HTML Toggle Button
```html
<!-- Theme Toggle Button -->
<button id="mcf-theme-toggle" class="mcf-theme-toggle" aria-label="Toggle dark mode">
  <svg class="mcf-sun-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="4" fill="#FCD34D"/>
    <path d="M10 0v4M10 16v4M20 10h-4M4 10H0M17.07 2.93l-2.83 2.83M5.76 14.24l-2.83 2.83M17.07 17.07l-2.83-2.83M5.76 5.76L2.93 2.93" stroke="#FCD34D" stroke-width="2"/>
  </svg>
  <svg class="mcf-moon-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M17.293 13.293A8 8 0 016.707 2.707a8 8 0 1010.586 10.586z" fill="#60A5FA"/>
  </svg>
</button>

<!-- CSS for Toggle Button -->
<style>
.mcf-theme-toggle {
  position: relative;
  width: 44px;
  height: 44px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mcf-sun-icon,
.mcf-moon-icon {
  position: absolute;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.mcf-sun-icon {
  opacity: 1;
  transform: rotate(0deg);
}

.mcf-moon-icon {
  opacity: 0;
  transform: rotate(-90deg);
}

.dark-mode .mcf-sun-icon {
  opacity: 0;
  transform: rotate(90deg);
}

.dark-mode .mcf-moon-icon {
  opacity: 1;
  transform: rotate(0deg);
}
</style>
```

---

## 🎭 6. ANIMATIONS & TRANSITIONS

### CSS Animations Library
```css
/* Keyframe Animations */
@keyframes mcf-slide-in {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes mcf-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes mcf-slide-in-right {
  from {
    transform: translateX(20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes mcf-bounce-soft {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

@keyframes mcf-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Animation Classes */
.mcf-animate-slide-in {
  animation: mcf-slide-in 0.5s ease-out forwards;
}

.mcf-animate-fade-in {
  animation: mcf-fade-in 0.3s ease-out forwards;
}

.mcf-animate-slide-in-right {
  animation: mcf-slide-in-right 0.5s ease-out forwards;
}

.mcf-animate-bounce {
  animation: mcf-bounce-soft 0.6s ease-out forwards;
}

.mcf-animate-pulse {
  animation: mcf-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Hover Animations */
.mcf-hover-lift {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.mcf-hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.mcf-hover-grow {
  transition: transform 0.3s ease;
}

.mcf-hover-grow:hover {
  transform: scale(1.05);
}
```

---

## 🏗️ 7. LAYOUT TEMPLATES

### Header Template
```html
<header class="mcf-header">
  <div class="mcf-container">
    <div class="mcf-header-content">
      <!-- Logo Section -->
      <div class="mcf-header-brand">
        <svg class="mcf-logo"><!-- Logo SVG --></svg>
        <div class="mcf-brand-text">
          <h1 class="mcf-brand-name">MY COLLEGE FINANCE</h1>
          <p class="mcf-tagline">EDUCATE • MOTIVATE • ELEVATE</p>
        </div>
      </div>
      
      <!-- Navigation -->
      <nav class="mcf-nav">
        <a href="#" class="mcf-nav-link">Home</a>
        <a href="#" class="mcf-nav-link">Calculator</a>
        <a href="#" class="mcf-nav-link">About</a>
        <a href="#" class="mcf-nav-link">Contact</a>
      </nav>
      
      <!-- Actions -->
      <div class="mcf-header-actions">
        <button id="mcf-theme-toggle" class="mcf-theme-toggle">
          <!-- Theme Toggle SVG -->
        </button>
      </div>
    </div>
  </div>
</header>

<style>
.mcf-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background-color: var(--mcf-background);
  border-bottom: 1px solid var(--mcf-border);
  backdrop-filter: blur(10px);
  background-color: rgba(var(--mcf-background), 0.8);
}

.mcf-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}

.mcf-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
}

.mcf-header-brand {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.mcf-brand-text {
  display: flex;
  flex-direction: column;
}

.mcf-nav {
  display: flex;
  gap: 2rem;
}

.mcf-nav-link {
  color: var(--mcf-foreground);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.mcf-nav-link:hover {
  color: var(--mcf-brand-blue);
}

.mcf-header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

@media (max-width: 768px) {
  .mcf-nav {
    display: none;
  }
  
  .mcf-brand-text {
    display: none;
  }
}
</style>
```

### Footer Template
```html
<footer class="mcf-footer">
  <div class="mcf-container">
    <div class="mcf-footer-content">
      <!-- Brand Section -->
      <div class="mcf-footer-brand">
        <svg class="mcf-logo-large"><!-- Logo SVG --></svg>
        <h2 class="mcf-footer-title">MY COLLEGE FINANCE</h2>
        <p class="mcf-footer-description">
          Empowering students with financial education and smart tools for a brighter future.
        </p>
      </div>
      
      <!-- Links -->
      <div class="mcf-footer-links">
        <a href="https://www.mycollegefinance.com/" class="mcf-footer-link">Main Website</a>
        <span class="mcf-footer-separator">•</span>
        <a href="https://www.mycollegefinance.com/privacy-policy" class="mcf-footer-link">Privacy Policy</a>
        <span class="mcf-footer-separator">•</span>
        <a href="https://www.mycollegefinance.com/terms-policy" class="mcf-footer-link">Terms of Service</a>
        <span class="mcf-footer-separator">•</span>
        <a href="https://linktr.ee/mycollegefinance" class="mcf-footer-link">Social Media</a>
      </div>
      
      <!-- Tagline -->
      <p class="mcf-footer-tagline">EDUCATE • MOTIVATE • ELEVATE</p>
      
      <!-- Copyright -->
      <p class="mcf-footer-copyright">
        © 2025 My College Finance. All rights reserved.
      </p>
    </div>
  </div>
</footer>

<style>
.mcf-footer {
  background: linear-gradient(to bottom, #111827, #000000);
  color: white;
  padding: 3rem 0;
  margin-top: 4rem;
}

.mcf-footer-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.mcf-footer-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.mcf-footer-title {
  font-size: 1.5rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  margin: 0;
}

.mcf-footer-description {
  max-width: 500px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  line-height: 1.6;
}

.mcf-footer-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  align-items: center;
}

.mcf-footer-link {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.3s ease;
}

.mcf-footer-link:hover {
  color: var(--mcf-brand-amber);
  text-decoration: underline;
}

.mcf-footer-separator {
  color: rgba(255, 255, 255, 0.3);
  font-size: 0.875rem;
}

.mcf-footer-tagline {
  font-size: 0.875rem;
  letter-spacing: 0.1em;
  color: var(--mcf-brand-amber);
  font-weight: 500;
  margin: 1rem 0;
}

.mcf-footer-copyright {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.dark-mode .mcf-footer {
  background: linear-gradient(to bottom, #000000, #111827);
}
</style>
```

---

## 📱 8. RESPONSIVE DESIGN

### Breakpoint System
```css
/* Mobile First Breakpoints */
/* Default: 0px - Mobile */
/* Small: 640px+ */
/* Medium: 768px+ */
/* Large: 1024px+ */
/* Extra Large: 1280px+ */

/* Responsive Container */
.mcf-container {
  width: 100%;
  margin: 0 auto;
  padding: 0 1rem;
}

@media (min-width: 640px) {
  .mcf-container {
    max-width: 640px;
  }
}

@media (min-width: 768px) {
  .mcf-container {
    max-width: 768px;
  }
}

@media (min-width: 1024px) {
  .mcf-container {
    max-width: 1024px;
  }
}

@media (min-width: 1280px) {
  .mcf-container {
    max-width: 1280px;
  }
}

/* Responsive Grid System */
.mcf-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(1, 1fr);
}

@media (min-width: 640px) {
  .mcf-grid-sm-2 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .mcf-grid-md-3 {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .mcf-grid-lg-4 {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Responsive Utilities */
.mcf-hide-mobile {
  display: none;
}

@media (min-width: 768px) {
  .mcf-hide-mobile {
    display: block;
  }
  
  .mcf-hide-desktop {
    display: none;
  }
}
```

---

## 🛠️ 9. UTILITY CLASSES

### Spacing Utilities
```css
/* Margin */
.mcf-m-0 { margin: 0; }
.mcf-m-1 { margin: 0.25rem; }
.mcf-m-2 { margin: 0.5rem; }
.mcf-m-3 { margin: 0.75rem; }
.mcf-m-4 { margin: 1rem; }
.mcf-m-5 { margin: 1.25rem; }
.mcf-m-6 { margin: 1.5rem; }
.mcf-m-8 { margin: 2rem; }
.mcf-m-10 { margin: 2.5rem; }
.mcf-m-12 { margin: 3rem; }

/* Padding */
.mcf-p-0 { padding: 0; }
.mcf-p-1 { padding: 0.25rem; }
.mcf-p-2 { padding: 0.5rem; }
.mcf-p-3 { padding: 0.75rem; }
.mcf-p-4 { padding: 1rem; }
.mcf-p-5 { padding: 1.25rem; }
.mcf-p-6 { padding: 1.5rem; }
.mcf-p-8 { padding: 2rem; }
.mcf-p-10 { padding: 2.5rem; }
.mcf-p-12 { padding: 3rem; }

/* Directional */
.mcf-mt-4 { margin-top: 1rem; }
.mcf-mb-4 { margin-bottom: 1rem; }
.mcf-ml-4 { margin-left: 1rem; }
.mcf-mr-4 { margin-right: 1rem; }
.mcf-mx-4 { margin-left: 1rem; margin-right: 1rem; }
.mcf-my-4 { margin-top: 1rem; margin-bottom: 1rem; }

.mcf-pt-4 { padding-top: 1rem; }
.mcf-pb-4 { padding-bottom: 1rem; }
.mcf-pl-4 { padding-left: 1rem; }
.mcf-pr-4 { padding-right: 1rem; }
.mcf-px-4 { padding-left: 1rem; padding-right: 1rem; }
.mcf-py-4 { padding-top: 1rem; padding-bottom: 1rem; }
```

### Display Utilities
```css
.mcf-block { display: block; }
.mcf-inline-block { display: inline-block; }
.mcf-inline { display: inline; }
.mcf-flex { display: flex; }
.mcf-inline-flex { display: inline-flex; }
.mcf-grid { display: grid; }
.mcf-hidden { display: none; }

/* Flexbox */
.mcf-flex-row { flex-direction: row; }
.mcf-flex-col { flex-direction: column; }
.mcf-flex-wrap { flex-wrap: wrap; }
.mcf-items-center { align-items: center; }
.mcf-items-start { align-items: flex-start; }
.mcf-items-end { align-items: flex-end; }
.mcf-justify-center { justify-content: center; }
.mcf-justify-between { justify-content: space-between; }
.mcf-justify-around { justify-content: space-around; }
.mcf-flex-1 { flex: 1; }
.mcf-gap-1 { gap: 0.25rem; }
.mcf-gap-2 { gap: 0.5rem; }
.mcf-gap-3 { gap: 0.75rem; }
.mcf-gap-4 { gap: 1rem; }
```

### Text Utilities
```css
.mcf-text-left { text-align: left; }
.mcf-text-center { text-align: center; }
.mcf-text-right { text-align: right; }
.mcf-text-justify { text-align: justify; }

.mcf-text-xs { font-size: 0.75rem; }
.mcf-text-sm { font-size: 0.875rem; }
.mcf-text-base { font-size: 1rem; }
.mcf-text-lg { font-size: 1.125rem; }
.mcf-text-xl { font-size: 1.25rem; }
.mcf-text-2xl { font-size: 1.5rem; }
.mcf-text-3xl { font-size: 1.875rem; }
.mcf-text-4xl { font-size: 2.25rem; }

.mcf-font-normal { font-weight: 400; }
.mcf-font-medium { font-weight: 500; }
.mcf-font-semibold { font-weight: 600; }
.mcf-font-bold { font-weight: 700; }
.mcf-font-black { font-weight: 900; }

.mcf-uppercase { text-transform: uppercase; }
.mcf-lowercase { text-transform: lowercase; }
.mcf-capitalize { text-transform: capitalize; }

.mcf-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

### Background Utilities
```css
.mcf-bg-transparent { background-color: transparent; }
.mcf-bg-white { background-color: #ffffff; }
.mcf-bg-black { background-color: #000000; }
.mcf-bg-primary { background-color: var(--mcf-primary); }
.mcf-bg-secondary { background-color: var(--mcf-secondary); }
.mcf-bg-brand-blue { background-color: var(--mcf-brand-blue); }
.mcf-bg-brand-green { background-color: var(--mcf-brand-green); }
.mcf-bg-brand-amber { background-color: var(--mcf-brand-amber); }
```

---

## 🎯 10. COMPLETE STARTER TEMPLATE

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My College Finance App</title>
  
  <!-- MCF Brand Styles -->
  <link rel="stylesheet" href="mcf-brand.css">
  
  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="mcf-logo.svg">
  
  <!-- Meta Tags -->
  <meta name="description" content="Empowering students with financial education and smart tools for a brighter future.">
  <meta name="keywords" content="college finance, student savings, financial education, savings calculator">
  <meta name="author" content="My College Finance">
  
  <!-- Open Graph -->
  <meta property="og:title" content="My College Finance">
  <meta property="og:description" content="EDUCATE • MOTIVATE • ELEVATE">
  <meta property="og:image" content="mcf-og-image.png">
  <meta property="og:url" content="https://www.mycollegefinance.com">
</head>
<body>
  <!-- Header -->
  <header class="mcf-header">
    <!-- Header content from template -->
  </header>
  
  <!-- Main Content -->
  <main class="mcf-container mcf-py-8">
    <section class="mcf-hero">
      <h1 class="mcf-h1 mcf-text-center mcf-mb-4">Welcome to My College Finance</h1>
      <p class="mcf-tagline mcf-text-center">EDUCATE • MOTIVATE • ELEVATE</p>
      
      <!-- Sample Card Grid -->
      <div class="mcf-grid mcf-grid-sm-2 mcf-grid-md-3 mcf-mt-8">
        <div class="mcf-card mcf-hover-lift">
          <div class="mcf-card-header">
            <h3 class="mcf-card-title">Education Savings</h3>
            <p class="mcf-card-description">Plan for college expenses</p>
          </div>
          <div class="mcf-card-content">
            <p>Start your education savings journey with our smart calculator.</p>
          </div>
        </div>
        <!-- More cards... -->
      </div>
      
      <!-- CTA Buttons -->
      <div class="mcf-flex mcf-justify-center mcf-gap-4 mcf-mt-8">
        <button class="mcf-btn mcf-btn-primary mcf-btn-lg">
          Get Started
        </button>
        <button class="mcf-btn mcf-btn-outline mcf-btn-lg">
          Learn More
        </button>
      </div>
    </section>
  </main>
  
  <!-- Footer -->
  <footer class="mcf-footer">
    <!-- Footer content from template -->
  </footer>
  
  <!-- MCF JavaScript -->
  <script src="mcf-brand.js"></script>
</body>
</html>
```

---

## 📚 11. IMPLEMENTATION CHECKLIST

### Essential Files to Create
- [ ] `mcf-brand.css` - Complete stylesheet with all variables and components
- [ ] `mcf-brand.js` - JavaScript for dark mode and interactions
- [ ] `mcf-logo.svg` - SVG logo file
- [ ] `index.html` - Main HTML template

### Setup Steps
1. **CSS Variables**: Copy all CSS variables to your main stylesheet
2. **Font Stack**: Apply the system font stack to body element
3. **Logo Integration**: Add SVG logo to header and footer
4. **Dark Mode**: Implement toggle functionality with localStorage
5. **Components**: Style buttons, cards, and forms using provided classes
6. **Animations**: Add keyframes and animation classes
7. **Responsive**: Apply mobile-first breakpoints
8. **Testing**: Test in both light and dark modes

### Brand Consistency Checklist
- [ ] Brand colors properly applied
- [ ] Typography hierarchy maintained
- [ ] Logo displayed at correct sizes
- [ ] Tagline "EDUCATE • MOTIVATE • ELEVATE" included
- [ ] Dark mode functional
- [ ] Animations smooth and consistent
- [ ] Responsive on all devices
- [ ] Links to main website included
- [ ] Copyright notice present

---

## 🔗 12. RESOURCES & LINKS

### Official Resources
- **Main Website**: https://www.mycollegefinance.com/
- **Privacy Policy**: https://www.mycollegefinance.com/privacy-policy
- **Terms of Service**: https://www.mycollegefinance.com/terms-policy
- **Social Media Hub**: https://linktr.ee/mycollegefinance

### Color Tools
- **HSL to HEX Converter**: https://www.rapidtables.com/convert/color/hsl-to-hex.html
- **Contrast Checker**: https://webaim.org/resources/contrastchecker/

### Performance Guidelines
- Minimize CSS file size (<50KB)
- Optimize images and use SVG where possible
- Lazy load non-critical resources
- Use CSS variables for maintainability

---

## 📄 13. LICENSE & USAGE

This brand guide is provided for creating applications under the My College Finance brand. All brand assets, including the logo, colors, and tagline are property of My College Finance.

**Permitted Uses:**
- Creating web applications for My College Finance
- Maintaining brand consistency across platforms
- Educational and financial tools aligned with brand mission

**Restrictions:**
- Do not modify the logo proportions or colors
- Do not use brand assets for unrelated products
- Maintain quality and professionalism in all implementations

---

**Document Version**: 1.0.0  
**Last Updated**: October 2025  
**Created for**: Traditional HTML Applications  

© 2025 My College Finance. All rights reserved.