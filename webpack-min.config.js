const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

const PATHS = {
    src: path.join(__dirname, 'src', 'index.js'),
    build: path.join(__dirname, 'dist')
};

module.exports = {
    entry: PATHS.src,
    mode: 'production',
    output: {
        path: PATHS.build,
        filename: "ambisafe.min.js",
        library: "Ambisafe",
        libraryTarget: "var"
    },
    module: {
        rules: [
            {
                test: /\.js/,
                exclude: /node_modules\/(?!(browserify-sha3|rlp)\/).*/,
                loader: "babel-loader",
            }
        ]
    },
    node: {
      fs: "empty"
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    output: {
                        comments: false,
                    },
                },
              }),
        ]
    }
};
