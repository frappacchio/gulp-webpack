'use strict';
import browser        from 'browser-sync';
import fs             from 'fs';
import gulp           from 'gulp';
import plugins        from 'gulp-load-plugins';
import yaml           from 'js-yaml';
import rimraf         from 'rimraf';
import named          from 'vinyl-named';
import webpackVersion from 'webpack';
import webpack        from 'webpack-stream';
import yargs          from 'yargs';
import webpackConfig  from './webpack.config';
// Load all Gulp plugins into one variable
const $ = plugins();
// Check for --production flag
const PRODUCTION = !!(yargs.argv.production);
// Load settings from settings.yml
const {COMPATIBILITY, PORT, UNCSS_OPTIONS, PATHS} = loadConfig();
function loadConfig()
{
  let ymlFile = fs.readFileSync('config.yml', 'utf8');
  return yaml.load(ymlFile);
}
// Build the "dist" folder by running all of the below tasks
gulp.task('build', gulp.series(clean, gulp.parallel(sass, javascript, images, copy)));
// Build the site, run the server, and watch for file changes
gulp.task('default', gulp.series('build', server, watch));
// Delete the "dist" folder
// This happens every time a build starts
function clean(done)
{
  rimraf(PATHS.dist, done);
}
// Copy files out of the assets folder
function copy()
{
  return gulp.src(PATHS.assets,{base:'./'})
             .pipe(gulp.dest(PATHS.dist + '/assets'));
}
// Compile Sass into CSS
// In production, the CSS is compressed
function sass()
{
  return gulp.src('src/assets/scss/app.scss')
             .pipe($.sourcemaps.init())
             .pipe($.sass({
                            includePaths: PATHS.sass
                          })
                    .on('error', $.sass.logError))
             .pipe($.autoprefixer({
                                    browsers: COMPATIBILITY
                                  }))
             .pipe($.if(PRODUCTION, $.cleanCss({compatibility: 'ie9'})))
             .pipe($.if(!PRODUCTION, $.sourcemaps.write()))
             .pipe(gulp.dest(PATHS.dist + '/assets/css'))
             .pipe(browser.reload({stream: true}));
}

// Combine JavaScript into one file
// In production, the file is minified
function javascript()
{
  return gulp.src(PATHS.entries)
             .pipe(named())
             .pipe($.sourcemaps.init())
             .pipe(webpack(webpackConfig, webpackVersion))
             .pipe($.if(PRODUCTION, $.uglify()
                                     .on('error', e =>
                                     {
                                       console.log(e);
                                     })
             ))
             .pipe($.if(!PRODUCTION, $.sourcemaps.write()))
             .pipe(gulp.dest(PATHS.dist + '/assets/js'));
}
// Copy images to the "dist" folder
// In production, the images are compressed
function images()
{
  return gulp.src('src/assets/img/**/*')
             .pipe($.if(PRODUCTION, $.imagemin({
                                                 progressive: true
                                               })))
             .pipe(gulp.dest(PATHS.dist + '/assets/img'));
}
// Start a server with BrowserSync to preview the site in
function server(done)
{
  browser.init({
                 server: PATHS.dist,
                 port: PORT
               });
  done();
}
// Reload the browser with BrowserSync
function reload(done)
{
  browser.reload();
  done();
}
// Watch for changes to static assets, pages, Sass, and JavaScript
function watch()
{
  gulp.watch(PATHS.assets, copy);
  gulp.watch('src/pages/**/*.html').on('all', gulp.series(pages, browser.reload));
  gulp.watch('src/assets/scss/**/*.scss').on('all', sass);
  gulp.watch('src/assets/js/**/*.js').on('all', gulp.series(javascript, browser.reload));
  gulp.watch('src/assets/img/**/*').on('all', gulp.series(images, browser.reload));
}