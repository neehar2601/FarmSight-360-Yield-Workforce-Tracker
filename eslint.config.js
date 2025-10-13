// This is the modern ESLint configuration file (flat config).
// It replaces the need for older formats like .eslintrc.js and command-line flags like --ext.

import globals from "globals";
import js from "@eslint/js";
import pluginReact from "eslint-plugin-react";

export default [
  // Global configuration settings
  {
    // Apply these settings to all relevant files
    files: ["**/*.{js,jsx}"],
    
    // Define plugins used
    plugins: {
      react: pluginReact,
    },

    // Language options
    languageOptions: {
      // Set ECMAScript version and module type
      ecmaVersion: 'latest',
      sourceType: "module",
      
      // Define global variables available in the environment (e.g., browser APIs)
      globals: {
        ...globals.browser,
      },
      
      // Tell ESLint how to parse the code
      parserOptions: {
        ecmaFeatures: {
          jsx: true, // Enable JSX parsing
        },
      },
    },

    // Linter options
    linterOptions: {
      // Report unused eslint-disable comments, helping to keep the codebase clean
      reportUnusedDisableDirectives: 'error',
    },

    // Define the rules
    rules: {
      // Start with ESLint's recommended set of rules
      ...js.configs.recommended.rules,
      // Add React's recommended set of rules
      ...pluginReact.configs.recommended.rules,
      
      // You can override or add custom rules here, for example:
      "react/prop-types": "off", // Turning off prop-types for this example
      "react/react-in-jsx-scope": "off", // Not needed with modern React
    },
    
    settings: {
        react: {
            version: 'detect' // Automatically detect the React version
        }
    }
  },
];
