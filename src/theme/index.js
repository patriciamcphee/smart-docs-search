// src/theme/index.js

// Re-export all default theme components from Docusaurus classic theme
export {default as Root} from '@docusaurus/theme-classic/lib/theme/Root';
export {default as DocItem} from '@docusaurus/theme-classic/lib/theme/DocItem';
export {default as Layout} from '@docusaurus/theme-classic/lib/theme/Layout';
export {default as Navbar} from '@docusaurus/theme-classic/lib/theme/Navbar';
export {default as NavbarItem} from '@docusaurus/theme-classic/lib/theme/NavbarItem';
export {default as Footer} from '@docusaurus/theme-classic/lib/theme/Footer';
export {default as TOC} from '@docusaurus/theme-classic/lib/theme/TOC';
export {default as Sidebar} from '@docusaurus/theme-classic/lib/theme/Sidebar';

// Export your custom search component to override the default
export {default as SearchBar} from './SearchBar/Search';