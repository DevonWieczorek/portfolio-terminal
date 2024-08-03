const { override, addWebpackModuleRule } = require('customize-cra');
// const addLessLoader = require("customize-cra-less-loader");

module.exports = override(
  addWebpackModuleRule({
    test: /\.(js|mjs)$/,
    include: [
      /node_modules\/pdfjs-dist/,
      /node_modules\/react-pdf/
    ],
    use: {
      loader: 'babel-loader',
      options: {
        presets: ['@babel/preset-env']
      }
    }
  }),
  addWebpackModuleRule({
    test: /\.less$/,
    use: [
      'style-loader',
      {
        loader: 'css-loader',
        options: {
          modules: {
            localIdentName: '[path][name]__[local]___[hash:base64:5]',
          },
        },
      },
      {
        loader: 'less-loader',
        options: {
          lessOptions: {
            javascriptEnabled: true,
          },
        },
      },
    ],
  }),
  addWebpackModuleRule({
	test: /\.md$/,
	use: 'raw-loader'
  }),
  (config) => {
    // Ensure .mjs files are processed by Babel
    const babelLoader = config.module.rules.find(rule => rule.use && rule.use.loader === 'babel-loader');
    if (babelLoader) {
      if (Array.isArray(babelLoader.test)) {
        babelLoader.test.push(/\.mjs$/);
      } else {
        babelLoader.test = [babelLoader.test, /\.mjs$/];
      }
    }

    return config;
  }
);