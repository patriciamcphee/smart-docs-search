# Smart Search Plugin for Docusaurus

A metadata-driven search plugin for Docusaurus 2.x that provides targeted, efficient search capabilities with an elegant, accessible interface. By leveraging metadata keywords, this plugin delivers precise search results while working seamlessly offline and in firewall-restricted environments.

👉 [Try the live demo](https://smart-search-plugin-demo.vercel.app/) | 📝 [Read the full blog post](https://www.patriciamcphee.com/blog/2024/11/08/enhancing-search-functionality/)

> Support for Docusaurus 3.x is a work in progress. Stay tuned!

## Why Smart Search?

The Smart Search Plugin reintroduces the proven concept of metadata keywords for documentation search while adding modern fuzzy search capabilities:

- 🎯 **Targeted Results**: Content tagged with relevant metadata receives higher ranking
- 🔍 **Fuzzy Search**: Intelligent matching tolerates typos and partial matches
- 🏃‍♀️ **Offline Operation**: Works behind firewalls without external API dependencies
- ⚡️ **Local Testing**: Test search functionality during development
- 📱 **Modern Interface**: Responsive design with full keyboard navigation
- ♿️ **Accessibility**: ARIA-compliant with keyboard navigation and screen reader support


## Installation

```bash
npm install smart-search-plugin
```

```bash
yarn add smart-search-plugin
```

## Configuration

Add the plugin to your `docusaurus.config.js`:

```jsx
const path = require('path');

  staticDirectories: ['static'], // Required for search index

  plugins: [
    path.resolve(__dirname, 'node_modules/smart-search-plugin')
  ],

  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          routeBasePath: '/',  // Required
          path: 'docs', // Required for the correct linking of topics
          showLastUpdateTime: true, // Enables last update display
        },
      },
    ],
  ],

  themeConfig: {
       navbar: {
      items: [
        {
          type: 'search',
          position: 'right',
        },
      ],
    },
  },
};

```

## Document structure

### Required directory structure

```
your-docusaurus-site/
├── docs/                   # Documentation root
│   ├── intro.md           # Documentation files
│   └── advanced/
│       └── config.md
├── static/                 # Static assets directory
└── docusaurus.config.js    # Configuration file

```

### Frontmatter configuration

Your markdown files can include these frontmatter fields for enhanced search functionality:

```markdown
---
title: Document Title
description: A brief description that appears in search results
keywords: [search, docusaurus, plugin]
draft: false                # Exclude from search when true
last_update:               # Optional update tracking
  date: 2024-03-20
  author: John Doe
---

```

## Content processing

### Smart content indexing

The plugin processes your content with these features:

1. **Intelligent caching**
    - File-based caching system for faster builds
    - Automatic detection of content changes
    - Incremental rebuilding for modified files only
2. **Content normalization**
    - Consistent URL generation across platforms
    - Special handling for index files
    - Clean URL paths for improved SEO
3. **Automatic exclusions**
Content automatically excluded from search:
    - Root/welcome page (URL: '/')
    - Draft documents
    - Content in excluded folders (default: 'contributor-guide')
    - Files with `draft: true` in frontmatter

### Search index generation

The plugin creates two search index files:

- `/build/searchIndex.json`: Public search index
- `/static/searchIndex.json`: Development index

## User interface

### Search component features

The search interface provides:

- Expandable search input
- Real-time results dropdown
- Keyboard navigation support
- Result highlighting
- Last update information display
- Mobile-friendly design

### Search Implementation

Here's how the Smart Search Plugin appears in your Docusaurus navbar:

1. **Inactive state**
   
   ![Image showing the search bar in its inactive state](https://github.com/patriciamcphee/portfolio/blob/main/blog/images/search-icon-only.png?raw=true)

2. **Activated state with results**

   ![Image showing the expanded search bar when clicked](https://github.com/patriciamcphee/portfolio/blob/main/blog/images/search-results.png?raw=true)

The search functionality seamlessly integrates with your Docusaurus theme while maintaining the metadata-driven approach.

### Keyboard shortcuts

The search interface supports full keyboard navigation:

- `/` or `Ctrl+K`: Focus search input
- `↑` / `↓`: Navigate through results
- `Enter`: Go to selected result
- `Escape`: Clear search or close dropdown
- `Tab`: Navigate through interactive elements


## Technical details

### Dependencies

The plugin uses these key dependencies:

- `fuse.js`: Fuzzy search implementation
- `antd`: UI components
- `@ant-design/icons`: UI icons
- `gray-matter`: Frontmatter parsing
- `unified`: Content processing

### Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- IE11 not supported

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT

## Credits

Built with:

- [Docusaurus](https://docusaurus.io/)
- [Ant Design](https://ant.design/)
- [Fuse.js](https://fusejs.io/)
