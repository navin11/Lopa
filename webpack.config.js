const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');


module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'lopa.min.js',
    libraryTarget: 'var',
    library: 'Lopa',
    libraryExport: 'default'
  },
  devtool: 'inline-source-map',
  devServer: {
      contentBase: path.resolve(__dirname, 'dist'),
      compress: true,
      watchContentBase: true,
      port: 9000
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: /\.scss$/,
        use: ExtractTextPlugin.extract(
          {
            fallback: 'style-loader',
            use: ['css-loader', 'sass-loader']
          })
      }
    ]
  },
  plugins: [ 
    new CleanWebpackPlugin(['dist']),
    new ExtractTextPlugin({filename: 'style.css'}),
    new HtmlWebpackPlugin({
        inject: false,
        hash: true,
        template: './src/index.html',
        filename: 'index.html'
      })
  ]
};