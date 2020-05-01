const path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var node_modules_dir = path.resolve(__dirname, 'node_modules');

module.exports = {
  entry: './lib/main.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.js', '.json', ]
  },

  plugins: [
      new HtmlWebpackPlugin({
        template:"index.html"
      }),
      new CopyWebpackPlugin([
        { from: '*.json', to:'dist' },
      ])
],
output: {
      filename: '[name].[contenthash].js',
        path: path.resolve(__dirname, 'dist'),
      },
   
  module: {
    rules: [
      {
        test: /\.css$/,
        exclude: [node_modules_dir],
        use: [
          'style-loader',
          'css-loader'
        ]
      },
      { 
        test: /\.html$/,
        exclude: [node_modules_dir],
         use: [ 
           "html-loader" 
          ]
      },

      {
        test: /\.(png|svg|jpe?g|gif)$/i,
        exclude: [node_modules_dir],
        use: [
          {
            loader: 'file-loader',
          },
        ],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        exclude: [node_modules_dir],
        use: [
            'file-loader',
        ],
      },
      {
        test: /\.xml$/,
        exclude: [node_modules_dir],
        use: [
            'xml-loader',
        ],
      },
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
        }
      }
    ]
  },
  externals: {
    knockout: "ko"
  }
};