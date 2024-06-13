  const path = require('path');
  const webpack = require('webpack');
  const HtmlWebpackPlugin = require('html-webpack-plugin');

  module.exports = {
    mode: 'development', // Change to 'production' for production builds
    entry: './src/index.js', // Tu archivo de entrada
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.js'
    },
    resolve: {
      alias: {
        core: path.join(__dirname, 'core'),
      },
      fallback: {
        "fs": false,
        "tls": false,
        "net": false,
        // "path": require.resolve("path-browserify"),
        "path": false,
        "zlib": false,
        "http": false,
        "https": false,
        "stream": false,
        "crypto": false,
        "timers": false,
        "querystring":false,
        "url":false
      }
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react']
            }
          }
        },
        {
          test: /\.css$/, // Regla para archivos CSS
          use: ['style-loader', 'css-loader']
        },
        {
          test: /\.svg$/, // Regla para archivos SVG
          use: [
            {
              loader: 'file-loader', // Usa file-loader para SVG
              options: {
                name: '[name].[ext]', // Mantiene el nombre original del archivo y su extensión
                outputPath: 'images/' // Directorio de salida para los archivos procesados
              }
            }
          ]
        }
      ]
    },
    plugins: [
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer']
      }),
      new HtmlWebpackPlugin({
        template: './public/index.html',
        favicon: './public/favicon.ico',
        filename: 'index.html',
        publicPath: '/' // Añade esta línea para asegurar que HtmlWebpackPlugin use el mismo publicPath
      })
    ],
    ignoreWarnings: [
      {
        module: /\.\/node_modules\/shumlex\/node_modules\/shex\/lib\/ShExLoader\.js/,
        message: /Critical dependency: the request of a dependency is an expression/
      }
    ]
  };
