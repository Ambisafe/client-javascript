const path = require('path');
const webpack = require('webpack');

const PATHS = {
    src: path.join(__dirname, 'src', 'index.js'),
    build: path.join(__dirname, 'dist')
};

module.exports = {
    entry: PATHS.src,
    output: {
        path: PATHS.build,
        filename: "ambisafe.min.js",
        library: "Ambisafe",
        libraryTarget: "var"
    },
    module: {
        preLoaders: [
            { test: /\.json/, loader: "json-loader" }
        ],
        loaders: [
            {
                test: /\.js/,
                exclude: /node_modules\/(?!(browserify-sha3|rlp)\/).*/,
                loader: "babel",
                query: {
                    presets: ['es2015'],
                    plugins: ['transform-object-assign'],
                }
            }
        ]
    },
    node: {
      fs: "empty"
    },
    plugins: [
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.OccurenceOrderPlugin(),
      new webpack.optimize.UglifyJsPlugin({ mangle: false, sourcemap: false }),
    ]
};