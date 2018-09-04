import fs   from 'fs';
import yaml from 'js-yaml';
import path from 'path';

const {PATHS} = loadConfig();
function loadConfig()
{
  let ymlFile = fs.readFileSync('config.yml', 'utf8');
  return yaml.load(ymlFile);
}
module.exports = {
  entry: PATHS.entries,
  output: {
    filename: PATHS.js,
    path: path.resolve(__dirname, PATHS.dist)
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
};