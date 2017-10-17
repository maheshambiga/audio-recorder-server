const path = require('path');
const webpack = require('webpack');

const config = {
  entry: path.join(process.cwd(), 'app/server.js'),
  output: {
    filename: 'server.bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/, // Transform all .js files required somewhere with Babel
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015'],
        },
      }
    ]
  },
  plugins: [

  ]
};

module.exports= config;