// src/index.js
const path = require('path');

// This is a plugin function that Docusaurus will call during build
module.exports = function searchPlugin(context, options) {
  return {
    // Name of your plugin
    name: 'smart-search-plugin',

    // This tells Docusaurus that we're providing theme components
    getThemePath() {
      return path.resolve(__dirname, './theme');
    },

    // Optional: Add any plugin configuration options
    // For example, you might want to add options for excluding certain paths from search
    configureWebpack(config, isServer) {
      return {
        // Any webpack configuration you need
      };
    },

    // Lifecycle hooks if needed
    async loadContent() {
      // Any content loading you need to do
    },
  };
};