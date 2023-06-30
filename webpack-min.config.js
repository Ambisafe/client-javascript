const path = require("path");

const PATHS = {
  src: path.join(__dirname, "src", "index.js"),
  build: path.join(__dirname, "dist"),
};

module.exports = {
  entry: PATHS.src,
  target: "web",
  output: {
    path: PATHS.build,
    filename: "ambisafe.min.js",
    library: "Ambisafe",
    libraryTarget: "umd",
    libraryExport: "default",
    umdNamedDefine: true,
    globalObject: 'this',
  },
  optimization: {
    minimize: true
  },
  module: {
    rules: [
      {
        test: /\.js/,
        exclude: /node_modules\/(?!(browserify-sha3|rlp)\/).*/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: ['babel-preset-env'],
              plugins: ["transform-object-assign"],
            },
          },
        ],
      },
    ],
  },
  node: {
    fs: "empty",
  },
  plugins: [],
};
