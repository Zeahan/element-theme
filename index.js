var gulp = require('gulp')
var series = require('run-sequence').use(gulp)
var task = require('./lib/task')
var extractor = require('./lib/extract-files')
var config = require('./lib/config')

var build = function (opts) {
  return function () {
    return task.build(Object.assign(opts, {message: 'build element theme'}))
  }
}

var fonts = function (opts) {
  return function () {
    return task.fonts(Object.assign(opts, {message: 'build theme font'}))
  }
}

exports.init = function (filePath) {
  filePath = {}.toString.call(filePath) === '[object String]' ? filePath : ''
  vars.init(filePath)
}

exports.extract = function ({all, source, targetDirectory}) {
  if (all) {
    // TODO
    return console.log('all');
  }
  if (!source) {
    return console.log('please specify a source file or use \'-a\' option to extract all source files')
  }
  extractor.extract(source, targetDirectory);
}

exports.watch = function (opts) {
  gulp.task('build', build(opts))
  exports.run(opts)
  gulp.watch(opts.config || config.config, ['build'])
}

exports.run = function (opts, cb) {
  gulp.task('build', build(opts))
  gulp.task('fonts', fonts(opts))
  if (typeof cb === 'function') {
    return series('build', 'fonts', cb);
  }
  return series('build', 'fonts');
}
