const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'development', // Change to 'production' for production builds
  entry: './src/index.js', // Tu archivo de entrada
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  resolve: {
    fallback: {
      "fs": false,
      "tls": false,
      "net": false,
      "path": require.resolve("path-browserify"),
      "zlib": require.resolve("browserify-zlib"),
      "http": require.resolve("stream-http"),
      "https": require.resolve("https-browserify"),
      "stream": require.resolve("stream-browserify"),
      "crypto": require.resolve("crypto-browserify"),
      "timers": require.resolve("timers-browserify"),
      "querystring": require.resolve("querystring-es3")
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
    })
  ]
};
