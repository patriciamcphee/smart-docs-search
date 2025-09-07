// babel.config.js

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: '18'
        }
      }
    ],
    [
      '@babel/preset-react',
      {
        runtime: 'automatic'
      }
    ]
  ],
  env: {
    production: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: '18'
            }
          }
        ],
        [
          '@babel/preset-react',
          {
            runtime: 'automatic'
          }
        ]
      ]
    },
    development: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: '18'
            }
          }
        ],
        [
          '@babel/preset-react',
          {
            runtime: 'automatic'
          }
        ]
      ]
    },
    test: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: 'current'
            }
          }
        ],
        [
          '@babel/preset-react',
          {
            runtime: 'automatic'
          }
        ]
      ]
    }
  }
};