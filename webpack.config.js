const path = require('path');

module.exports = {
	mode: 'development',
	devtool: 'inline-source-map',
	entry: './src/index.ts',
	module: {
		rules: [
			{
				test: /\.m?js/, resolve: {
					fullySpecified: false
				}
			},
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
	},
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'dist'),
	},
};