const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');

const hotMiddlewareScript = 'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000&reload=true';

module.exports = {
  mode: 'development',
  entry: {
    intro: ['./areas/js/00-intro.js', hotMiddlewareScript],
    faces: ['./areas/js/01-faces.js', hotMiddlewareScript],
    reflection: ['./areas/js/02-reflection.js', hotMiddlewareScript],
    selection: ['./areas/js/03-selection.js', hotMiddlewareScript],
    convo1: ['./areas/js/04-convo1.js', hotMiddlewareScript],
    convo2: ['./areas/js/05-convo2.js', hotMiddlewareScript],
    passive: ['./areas/js/06-passive.js', hotMiddlewareScript],
  },
  output: {
    filename: 'js/[name].[contenthash].js',
    path: __dirname + '/dist',
    publicPath: '/',
  },
  module: {
    rules: [
    {
      test: /\.s(a|c)ss$/,
      sideEffects: true,
      use: [
        MiniCssExtractPlugin.loader,
        'css-loader',
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
    new webpack.ProvidePlugin({
      $: 'jquery',
    }),
    new MiniCssExtractPlugin({
      filename: 'css/[name].css',
    }),
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
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
  ],
  optimization: {
    minimize: false
  },
};