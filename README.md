# Smart Search Plugin for Docusaurus 3.x

A modern, fast, and user-friendly search plugin for Docusaurus 3.x that provides enhanced search functionality with a clean interface, keyboard navigation, and click-outside-to-close functionality.

## Features

- 🔍 **Fast local search** - No external dependencies or API calls required
- 🎯 **Smart search results** - Searches through document titles, content, headings, and sections
- ⌨️ **Keyboard navigation** - Full keyboard support with arrow keys, Enter, and Escape
- 🖱️ **Click outside to close** - Intuitive UX with click-outside-to-close functionality
- 🎨 **Modern UI** - Clean, responsive design that adapts to light/dark themes
- 📱 **Mobile friendly** - Responsive design that works on all devices
- 🚀 **Performance optimized** - Intelligent caching and efficient search algorithms
- 🎛️ **Highly configurable** - Customizable search options and exclusion rules

## Installation

```bash
npm install smart-search-plugin
# or
yarn add smart-search-plugin
# or
pnpm add smart-search-plugin
```

## Configuration

Add the plugin to your `docusaurus.config.js`:

```javascript
// docusaurus.config.js
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  // ... other config options

  plugins: [
    [
      'smart-search-plugin',
      {
        // Optional configuration
        excludedFolders: ['contributor-guide', 'includes', '_includes'],
        excludedPrefixes: ['_'],
        maxSearchResults: 10,
        cacheEnabled: true,
        searchIndexFilename: 'searchIndex.json'
      }
    ]
  ],

  themeConfig: {
    navbar: {
      items: [
        // ... other navbar items
        // Note: SearchBar will be automatically added by the plugin
      ],
    },
    // ... other theme config
  },
};

export default config;
```

## Plugin Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `excludedFolders` | `string[]` | `['contributor-guide', 'includes', '_includes']` | Folders to exclude from search indexing |
| `excludedPrefixes` | `string[]` | `['_']` | File/folder prefixes to exclude from indexing |
| `maxSearchResults` | `number` | `10` | Maximum number of search results to display |
| `cacheEnabled` | `boolean` | `true` | Enable/disable search index caching |
| `searchIndexFilename` | `string` | `'searchIndex.json'` | Custom filename for the search index |

## Usage

Once installed and configured, the search bar will automatically appear in your site's navbar. Users can:

1. **Click the search icon** to open the search input
2. **Type their search query** to see real-time results
3. **Use keyboard navigation:**
   - `↑`/`↓` arrow keys to navigate results
   - `Enter` to select a result
   - `Escape` to close the search
   - `Tab`/`Shift+Tab` for accessibility navigation
4. **Click outside the search area** to close the dropdown
5. **Click on any result** to navigate to that page/section

## Search Features

### Document and Section Search
The plugin searches through:
- Document titles and descriptions
- Document content
- Section headings
- Section content
- Keywords from frontmatter

### Smart Result Ranking
Results are intelligently ranked based on:
- Match location (title matches rank higher)
- Match quality (exact matches rank higher)
- Content relevance

### Result Types
- **Document results** - Show the full document with preview content
- **Section results** - Show specific sections within documents with direct links

## Customization

### Styling
The search component uses CSS modules. You can override styles by targeting these classes:

```css
/* Custom styles for search component */
.searchContainer { /* Main container */ }
.searchWrapper { /* Search input wrapper */ }
.searchInput { /* Search input field */ }
.dropdownResults { /* Results dropdown */ }
.resultItem { /* Individual result item */ }
.highlighted { /* Highlighted search terms */ }
```

### Dark Mode
The plugin automatically adapts to Docusaurus's dark mode using CSS custom properties.

## Requirements

- **Docusaurus**: 3.0.0 or higher
- **Node.js**: 18.0.0 or higher
- **React**: 18.0.0 or higher

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Migration from Docusaurus 2.x

If you're upgrading from a Docusaurus 2.x version of this plugin:

1. Update your Docusaurus installation to 3.x
2. Install the new version of this plugin: `npm install smart-search-plugin@^3.0.0`
3. Update your `docusaurus.config.js` to use the new ESM syntax
4. No other changes required - the plugin API remains the same

## Performance

The plugin is designed for optimal performance:
- **Build time**: Intelligent caching prevents unnecessary reprocessing
- **Runtime**: Local search with no external API calls
- **Bundle size**: Minimal impact on your site's bundle size
- **Memory usage**: Efficient search algorithms with lazy loading

## Troubleshooting

### Search index is empty
Check that:
1. Your `docs` folder exists and contains `.md` or `.mdx` files
2. Your documents have `title` frontmatter
3. Documents are not marked as `draft: true`

### Search not appearing
Ensure:
1. The plugin is correctly added to your `docusaurus.config.js`
2. You've restarted your development server after configuration changes
3. No other search plugins are conflicting

### Build errors
Make sure:
1. You're using compatible versions (see Requirements section)
2. All peer dependencies are installed
3. Your Node.js version is 18.0.0 or higher

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our GitHub repository.

## License

MIT License - see LICENSE file for details.

## Support

- GitHub Issues: Report bugs and request features
- Documentation: Check our full documentation
- Community: Join our discussions

---

Made with ❤️ for the Docusaurus community