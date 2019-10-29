const path = require('path');

const PATHS = {
    src: path.join(__dirname, 'src', 'index.js'),
    build: path.join(__dirname, 'dist')
};

module.exports = {
    entry: PATHS.src,
    mode: 'development',
    output: {
        path: PATHS.build,
        filename: "ambisafe.js",
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
    }
};
