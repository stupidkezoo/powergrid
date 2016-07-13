const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {

    devtool: 'source-map',

    entry: [
          'babel-polyfill',
          './web/index.js'
        ],
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                loader: 'babel'
            },
            {
                test: /\.css$/,
                loader: 'style-loader!css-loader'
            },
            {
                test: /\.(ttf|eot|svg|gif|woff(2)?)(\?[a-z0-9=&.]+)?$/,
                loader: 'file-loader'
            },
            {
                test: /\.html$/,
                loader: 'html'
            },
            {
                test: /\.json/,
                loader: 'json'
            }]
    },
    resolve: {
        modulesDirectories: ['web', 'node_modules'],
        extensions: ['', '.js', '.jsx']
    },
    output: {
        path: __dirname + '/dist',
        publicPath: '/',
        filename: 'bundle.js'
    },
    devServer: {
        contentBase: './dist'
    },
    plugins: [
        new CopyWebpackPlugin([
            { from: 'web/react.html', to: 'index.html' }
        ])
    ]
};
