# Jasmine Zheng Website - Development Documentation

This document provides a comprehensive guide to the HTML, CSS, and JavaScript structure of the jasmine-zheng.github.io website for future development and content additions.

---

## Site Structure Overview

```
jasmine-zheng.github.io/
|-- index.html              # Homepage with hero carousel and featured content
|-- css/
|   |-- style.css          # Main stylesheet with all components
|-- js/
|   |-- main.js            # Interactive functionality (nav, carousel)
|   |-- site-vars.js       # Site-wide variable management
|-- pages/
|   |-- writing.html       # Writing portfolio page
|   |-- dance.html         # Dance portfolio page
|   |-- music.html         # Music portfolio page
|   |-- neuroscience.html  # Neuroscience research page
|   |-- projects.html      # Projects showcase page
|   |-- experiences.html   # Experiences and activities page
|-- blog/
|   |-- index.html         # Blog index page
|   |-- template.html      # Template for new blog posts
|   |-- [post-files].html  # Individual blog posts
|-- images/
|   |-- [category-images]  # Organized by content type
|   |-- content/           # Additional content images
|-- videos/                # Video content directory
```

---

## HTML Structure & Patterns

### 1. Standard HTML Template

All pages follow this basic structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Title - Jasmine Zheng</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/style.css">
</head>
<body>
  <!-- Navigation -->
  <nav class="navbar">...</nav>
  
  <!-- Page Content -->
  <main>
    <section class="page-hero">...</section>
    <section class="page-content">...</section>
  </main>
  
  <!-- Footer -->
  <footer class="footer">...</footer>
  
  <script src="../js/site-vars.js"></script>
  <script src="../js/main.js"></script>
</body>
</html>
```

### 2. Navigation Component

The navigation is consistent across all pages:

```html
<nav class="navbar">
  <div class="container">
    <a href="../index.html" class="nav-brand site-name"></a>
    <button class="nav-toggle" aria-label="Toggle navigation">
      <span></span><span></span><span></span>
    </button>
    <ul class="nav-links">
      <li><a href="../index.html">Home</a></li>
      <li><a href="../pages/writing.html">Writing</a></li>
      <li><a href="../pages/dance.html">Dance</a></li>
      <li><a href="../pages/music.html">Music</a></li>
      <li><a href="../pages/neuroscience.html">Neuroscience</li>
      <li><a href="../pages/projects.html">Projects</a></li>
      <li><a href="../pages/experiences.html">Experiences</a></li>
      <li><a href="../blog/index.html">Blog</a></li>
    </ul>
  </div>
</nav>
```

**Note:** On the homepage (`index.html`), remove the `../` from paths since it's in the root directory.

### 3. Hero Carousel (Homepage)

The homepage features a Swiper.js carousel:

```html
<section class="hero">
  <div class="swiper hero-carousel">
    <div class="swiper-wrapper">
      <div class="swiper-slide">
        <img src="images/image.jpg" alt="Description">
        <div class="slide-overlay">
          <h2>Slide Title</h2>
          <p>Slide description</p>
        </div>
      </div>
      <!-- Add more slides as needed -->
    </div>
    <div class="swiper-pagination"></div>
    <div class="swiper-button-next"></div>
    <div class="swiper-button-prev"></div>
  </div>
</section>
```

### 4. Page Hero Section

For individual pages:

```html
<section class="page-hero">
  <div class="container">
    <h1>Page Title</h1>
    <p>Page subtitle or description</p>
  </div>
</section>
```

### 5. Content Blocks

For organizing page content:

```html
<div class="content-block">
  <h2>Section Title</h2>
  <p>Content goes here...</p>
</div>
```

### 6. Card Grid Component

For displaying multiple items:

```html
<div class="card-grid">
  <a href="page.html" class="card">
    <div class="card-body">
      <h3>Card Title</h3>
      <p>Card description</p>
      <div class="card-meta">
        <span>Date or metadata</span>
        <span class="tag">Category</span>
      </div>
    </div>
  </a>
  <!-- Add more cards -->
</div>
```

### 7. Explore Grid Component

For visual category navigation:

```html
<div class="explore-grid">
  <a href="page.html" class="explore-card">
    <img src="images/image.jpg" alt="Category">
    <div class="explore-label">Category Name</div>
  </a>
  <!-- Add more explore cards -->
</div>
```

### 8. Photo Gallery Component

For displaying multiple images:

```html
<div class="photo-gallery">
  <img src="images/image1.jpg" alt="Description">
  <img src="images/image2.jpg" alt="Description">
  <!-- Add more images -->
</div>
```

### 9. Blog List Component

For blog post listings:

```html
<div class="blog-list">
  <div class="blog-entry">
    <div class="blog-date">Jan 31, 2026</div>
    <div class="blog-info">
      <h3><a href="blog/post.html">Post Title</a></h3>
      <p class="blog-excerpt">Post excerpt</p>
      <div class="blog-tags">
        <span class="tag">category</span>
      </div>
    </div>
  </div>
  <!-- Add more blog entries -->
</div>
```

### 10. Footer Component

```html
<footer class="footer">
  <ul class="footer-links">
    <li><a href="pages/writing.html">Writing</a></li>
    <li><a href="pages/dance.html">Dance</a></li>
    <li><a href="pages/music.html">Music</a></li>
    <li><a href="pages/neuroscience.html">Neuroscience</a></li>
    <li><a href="pages/projects.html">Projects</a></li>
    <li><a href="pages/experiences.html">Experiences</a></li>
  </ul>
  <p class="footer-copy">&copy; 2026 <span class="site-name"></span>. Hosted on GitHub Pages.</p>
</footer>
```

---

## CSS Architecture

### Color Variables

```css
:root {
  --primary: #2c3e50;        /* Main text color */
  --accent: #5a8f7b;         /* Primary accent color */
  --accent-light: #7ab89e;   /* Lighter accent for hover states */
  --text: #333;              /* Body text */
  --text-light: #666;        /* Secondary text */
  --bg: #fff;                /* Main background */
  --bg-light: #f8f9fa;       /* Light background for sections */
  --bg-alt: #f0f2f5;         /* Alternative background */
  --border: #e0e0e0;         /* Border color */
  --shadow: 0 2px 8px rgba(0,0,0,0.08);
  --shadow-hover: 0 4px 16px rgba(0,0,0,0.12);
  --radius: 8px;             /* Border radius */
  --max-width: 1200px;       /* Max content width */
  --nav-height: 64px;        /* Navigation height */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-serif: 'Playfair Display', Georgia, serif;
}
```

### Typography

* **Headings (h1-h4):** Use `Playfair Display` (serif)
* **Body text:** Use `Inter` (sans-serif)
* **Navigation:** Use `Inter` (sans-serif)

### Key CSS Classes

#### Layout Classes
* `.container` - Centers content with max-width
* `.section` - Standard section with padding
* `.section-alt` - Section with light background
* `.about-grid` - Two-column grid for about section

#### Component Classes
* `.navbar` - Fixed navigation bar
* `.hero-carousel` - Swiper carousel container
* `.card-grid` - Grid of card components
* `.card` - Individual card component
* `.explore-grid` - Grid of explore cards
* `.explore-card` - Individual explore card
* `.photo-gallery` - Grid of images
* `.blog-list` - List of blog entries
* `.blog-entry` - Individual blog entry
* `.video-grid` - Grid of video cards
* `.btn` - Primary button
* `.btn-outline` - Outline button

#### Utility Classes
* `.tag` - Small badge/tag styling
* `.site-name` - Gets populated by JavaScript
* `.site-short-name` - Gets populated by JavaScript

### Responsive Breakpoints

```css
@media (max-width: 768px) {
  /* Tablet and mobile styles */
}

@media (max-width: 480px) {
  /* Mobile styles */
}
```

---

## JavaScript Functionality

### 1. Site Variables (`site-vars.js`)

This file manages site-wide variables that are dynamically inserted:

```javascript
var SITE = {
  name: "Jasmine Yaxin Zheng",
  short_name: "Jasmine Zheng",
};
```

**Usage in HTML:**
* `<span class="site-name"></span>` - Will display "Jasmine Yaxin Zheng"
* `<span class="site-short-name"></span>` - Will display "Jasmine Zheng"
* `{site_name}` in meta tags - Gets replaced with full name

### 2. Main JavaScript (`main.js`)

**Navigation Features:**
* Scroll effect: Adds shadow to navbar when scrolled
* Mobile toggle: Hamburger menu for mobile devices
* Active link highlighting: Automatically highlights current page

**Carousel Initialization:**
```javascript
new Swiper('.hero-carousel', {
  loop: true,
  autoplay: {
    delay: 4000,
    disableOnInteraction: false,
  },
  effect: 'fade',
  fadeEffect: { crossFade: true },
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
});
```

---

## Image Organization

### Current Image Structure

```
images/
|-- Dance Images:
|   |-- dance1.jpg
|   |-- dance2.jpg
|   |-- dance3.jpg
|   |-- DSC_RichYeePhoto-98.jpg
|-- Music Images:
|   |-- piano_recital.jpg
|   |-- piano_recital2.jpg
|   |-- piano_cert.jpg
|   |-- piano_protege.jpg
|-- Writing Images:
|   |-- writing_workshop1.jpg
|   |-- writing_workshop2.jpg
|-- Neuroscience Images:
|   |-- summer_stanford.jpg
|   |-- outward_bound1.jpg
|   |-- outward_bound2.jpg
|-- Projects Images:
|   |-- [project-specific images]
|-- Experiences Images:
|   |-- rock_climbing.jpg
|   |-- rock_climbing1.jpg
|   |-- volleyball.jpg
|   |-- volunteer_fcsn.jpg
|-- Profile:
|   |-- jasmine_2025.jpeg
|   |-- profile.svg
|-- SVG Icons:
|   |-- explore-[category].svg
|   |-- hero-[category].svg
```

### Adding New Images

1. **Choose appropriate location:**
   * Place images in the `images/` directory
   * Consider organizing by category (dance, music, writing, etc.)

2. **Image naming conventions:**
   * Use lowercase with underscores: `image_name.jpg`
   * Be descriptive: `dance_competition_2025.jpg`
   * Include dates if relevant: `writing_workshop_june_2025.jpg`

3. **Image optimization:**
   * Use JPEG for photos
   * Use PNG for graphics with transparency
   * Use SVG for icons and simple graphics
   * Keep file sizes reasonable (under 500KB for web)

4. **Using images in HTML:**
   ```html
   <img src="images/your_image.jpg" alt="Descriptive alt text">
   ```

---

## Adding New Content

### Adding a New Blog Post

1. **Copy the template:**
   * Use `blog/template.html` as a starting point
   * Replace `{{title}}`, `{{subtitle}}`, and `{{content}}` with actual content

2. **Create the file:**
   * Save as `blog/your-post-title.html`
   * Use kebab-case for filenames

3. **Add to blog index:**
   * Update `blog/index.html` to include the new post in the blog list

4. **Example blog post structure:**
   ```html
   <!DOCTYPE html>
   <html lang="en">
   <head>
     <meta charset="UTF-8">
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <title>Your Post Title - Jasmine Zheng</title>
     <link rel="stylesheet" href="../css/style.css">
   </head>
   <body>
     <nav class="navbar">...</nav>
     <article>
       <section class="page-hero">
         <div class="container">
           <h1>Your Post Title</h1>
           <p>Your subtitle or date</p>
         </div>
       </section>
       <section class="page-content">
         <div class="container" style="max-width:800px">
           <p>Your blog content goes here...</p>
         </div>
       </section>
     </article>
     <footer class="footer">...</footer>
     <script src="../js/site-vars.js"></script>
     <script src="../js/main.js"></script>
   </body>
   </html>
   ```

### Adding Content to Existing Pages

1. **Navigate to the appropriate page file:**
   * `pages/writing.html` for writing content
   * `pages/dance.html` for dance content
   * `pages/music.html` for music content
   * `pages/neuroscience.html` for neuroscience content
   * `pages/projects.html` for projects
   * `pages/experiences.html` for experiences

2. **Add content within content blocks:**
   ```html
   <div class="content-block">
     <h2>New Section Title</h2>
     <p>Your content description...</p>
     
     <!-- Add images if needed -->
     <div class="photo-gallery">
       <img src="../images/your_image.jpg" alt="Description">
     </div>
     
     <!-- Add cards if needed -->
     <div class="card-grid">
       <a href="#" class="card">
         <div class="card-body">
           <h3>Card Title</h3>
           <p>Card description</p>
         </div>
       </a>
     </div>
   </div>
   ```

### Adding New Pages

1. **Create new HTML file in `pages/` directory**
2. **Follow the standard HTML template**
3. **Update navigation on all pages** to include the new page link
4. **Update footer** to include the new page link

---

## External Dependencies

### CDN Resources

1. **Google Fonts:**
   * Inter (sans-serif)
   * Playfair Display (serif)

2. **Swiper.js (Carousel):**
   * CSS: `https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css`
   * JS: `https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js`

---

## Development Guidelines

### Code Style

1. **HTML:**
   * Use semantic HTML5 elements
   * Include proper alt text for images
   * Use consistent indentation (2 spaces)
   * Close all tags properly

2. **CSS:**
   * Use CSS custom properties (variables) for colors and spacing
   * Follow mobile-first responsive design
   * Use meaningful class names
   * Keep specificity low

3. **JavaScript:**
   * Use modern ES6+ syntax
   * Keep functions focused and single-purpose
   * Add comments for complex logic

### Testing

1. **Test on multiple devices:**
   * Desktop (1920x1080)
   * Tablet (768x1024)
   * Mobile (375x667)

2. **Test browsers:**
   * Chrome
   * Safari
   * Firefox
   * Edge

3. **Check accessibility:**
   * Alt text for images
   * Proper heading hierarchy
   * Keyboard navigation
   * Color contrast

---

## Common Tasks

### Updating the Hero Carousel

1. Open `index.html`
2. Locate the `.hero-carousel` section
3. Add/remove `.swiper-slide` elements as needed
4. Update image paths and text content

### Adding a New Tag/Category

1. Add the tag to content using: `<span class="tag">Category Name</span>`
2. Style is automatically applied by CSS

### Changing Color Scheme

1. Update CSS variables in `css/style.css`:
   ```css
   :root {
     --accent: #your-color;
     --accent-light: #your-lighter-color;
     /* ... other variables */
   }
   ```

### Updating Site Name

1. Edit `js/site-vars.js`:
   ```javascript
   var SITE = {
     name: "Your Full Name",
     short_name: "Your Short Name",
   };
   ```

---

## File Path Reference

### From Root (`index.html`)
* CSS: `css/style.css`
* JS: `js/main.js`, `js/site-vars.js`
* Images: `images/image.jpg`
* Pages: `pages/page.html`
* Blog: `blog/post.html`

### From Pages (`pages/*.html`)
* CSS: `../css/style.css`
* JS: `../js/main.js`, `../js/site-vars.js`
* Images: `../images/image.jpg`
* Root: `../index.html`
* Blog: `../blog/post.html`

### From Blog (`blog/*.html`)
* CSS: `../css/style.css`
* JS: `../js/main.js`, `../js/site-vars.js`
* Images: `../images/image.jpg`
* Root: `../index.html`
* Pages: `../pages/page.html`

---

## Future Development Ideas

1. **Add dark mode toggle**
2. **Implement search functionality**
3. **Add social sharing buttons**
4. **Create an image lightbox for galleries**
5. **Add newsletter signup**
6. **Implement lazy loading for images**
7. **Add animation library for scroll effects**
8. **Create a contact form**
9. **Add comments system for blog posts**
10. **Implement RSS feed for blog**

---

## Maintenance Checklist

* [ ] Regularly backup the repository
* [ ] Update copyright year in footer annually
* [ ] Test all links periodically
* [ ] Optimize images for web performance
* [ ] Check for broken external links
* [ ] Update dependencies (Swiper.js, etc.)
* [ ] Review and update content regularly
* [ ] Monitor site performance

---

## Contact & Support

For questions about this documentation or website development, refer to the original developer or consult online resources for HTML, CSS, and JavaScript best practices.

---

*Last updated: May 23, 2026*