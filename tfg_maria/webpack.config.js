const path = require('path');

module.exports = {
  entry: './src/index.js', // Tu archivo de entrada
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
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
  }
};
