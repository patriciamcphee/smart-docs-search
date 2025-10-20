# smart-search-plugin

A powerful fuzzy search plugin for Docusaurus 3.x that provides real-time local search with section-level results.

## Features

- 🔍 **Fuzzy Search**: Tolerant to typos using Fuse.js
- 📑 **Section-Level Search**: Search within document headings
- ⚡ **Real-Time Results**: Instant search as you type
- 🎨 **Modern UI**: Clean interface with Ant Design
- 🌙 **Dark Mode Support**: Seamless theme adaptation
- ⌨️ **Keyboard Navigation**: Full keyboard support
- 📊 **Smart Ranking**: Customizable result weights
- 🚀 **Static Index**: Pre-built for performance

## Installation

```bash
npm install smart-search-plugin antd fuse.js
# or
yarn add smart-search-plugin antd fuse.js
```

## Configuration

Add to your `docusaurus.config.js`:

```javascript
module.exports = {
  plugins: [
    [
      'smart-search-plugin',
      {
        // Optional configuration
        excludedFolders: ['drafts', 'archive'],
        excludedPrefixes: ['_'],
        searchWeights: {
          title: 1.0,
          'sections.heading': 1.0,
          keywords: 0.8,
          description: 0.6,
          'sections.content': 0.5,
          content: 0.4
        }
      }
    ]
  ],
  
  // If using classic theme, ensure SearchBar is swizzled or replaced
  themeConfig: {
    navbar: {
      items: [
        // ... other items
      ]
    }
  }
};
```

## Options

| Option             | Type       | Default                                          | Description              |
| :----------------- | :--------- | :----------------------------------------------- | :----------------------- |
| `excludedFolders`  | `string[]` | `['contributor-guide', 'includes', '_includes']` | Folders to exclude       |
| `excludedPrefixes` | `string[]` | `['_']`                                          | File prefixes to exclude |
| `searchWeights`    | `object`   | See below                                        | Customize result ranking |

## Usage

The plugin automatically:

1. Indexes your docs at build time
2. Creates a static search index
3. Provides a SearchBar component
4. Handles all search functionality

### Excluding Documents

Add to frontmatter:

```yaml
---
title: My Document
draft: true  # Excludes from search
# or
search_exclude: true  # Also excludes
---
```

## Compatibility

- Docusaurus 3.x
- React 18+ or 19+
- Node.js 18+

## Migration from v2

If migrating from Docusaurus 2.x version:

1. Update Docusaurus to v3
2. Install this package
3. Update configuration as shown above

## License

MIT &copy; Patricia McPhee

## Contributing

Issues and PRs welcome at [GitHub](https://github.com/patriciamcphee/smart-search-plugin)