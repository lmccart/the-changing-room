const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  entry: {
    intro: './areas/js/00-intro.js',
    faces: './areas/js/01-faces.js',
    reflection: './areas/js/02-reflection.js',
    selection: './areas/js/03-selection.js',
    convo1: './areas/js/04-convo1.js',
    convo2: './areas/js/05-convo2.js',
    passive: './areas/js/06-passive.js',
  },
  output: {
    filename: 'js/[name].[contenthash].js',
    path: __dirname + '/dist'
  },
  module: {
    rules: [
    {
      test: /\.s(a|c)ss$/,
      use: [
        {loader: 'style-loader'},
        {loader: 'css-loader'},
        {
          loader: 'sass-loader',
          options: {
            sourceMap: true
          }
        }
      ]
    }]
  },
  plugins: [
  new HtmlWebpackPlugin({  
    filename: '00-intro/index.html',
    template: './areas/00-intro/index.html',
    chunks: ['intro'],
    minify: false,
  }),
  new HtmlWebpackPlugin({  
    filename: '01-faces/index.html',
    template: './areas/01-faces/index.html',
    chunks: ['faces'],
    minify: false,
  }),
  new HtmlWebpackPlugin({  
    filename: '02-reflection/index.html',
    template: './areas/02-reflection/index.html',
    chunks: ['reflection'],
    minify: false,
  }),
  new HtmlWebpackPlugin({  
    filename: '03-selection/index.html',
    template: './areas/03-selection/index.html',
    chunks: ['selection'],
    minify: false,
  }),
  new HtmlWebpackPlugin({  
    filename: '04-convo1/index.html',
    template: './areas/04-convo1/index.html',
    chunks: ['convo1'],
    minify: false,
  }),
  new HtmlWebpackPlugin({  
    filename: '05-convo2/index.html',
    template: './areas/05-convo2/index.html',
    chunks: ['convo2'],
    minify: false,
  }),
  new HtmlWebpackPlugin({  
    filename: '06-passive/index.html',
    template: './areas/06-passive/index.html',
    chunks: ['passive'],
    minify: false,
  }),
  new CleanWebpackPlugin(),
  ],
  optimization: {
    minimize: false
  }
};