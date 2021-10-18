var path = require('path')
var fs = require('fs')
var gulp = require('gulp')
var ora = require('ora')
var nop = require('gulp-nop')
var sass = require('gulp-sass')
var autoprefixer = require('gulp-autoprefixer')
var cssmin = require('gulp-cssmin')
var config = require('./config')

exports.fonts = function (opts) {
  var spin = ora(opts.message).start()
  var stream = gulp.src(path.resolve(config.themePath, './fonts/**'))
    .pipe((opts.minimize || config.minimize) ? cssmin({showLog: false}) : nop())
    .pipe(gulp.dest(path.resolve(opts.out || config.out, './fonts')))
    .on('end', function () {
      spin.succeed()
    })

  return stream
}

exports.build = function (opts) {
  var spin = ora(opts.message).start()
  var stream
  var components
  var cssFiles = '*'

  if (config.components) {
    components = config.components.concat(['base'])
    cssFiles = '{' + components.join(',') + '}'
  }
  
  try {
    writeFiles(opts, spin);
  } catch (e) {
    console.error(e);
    spin.text = 'write theme source files failed';
    return spin.fail();
  }

  
  stream = gulp.src(path.resolve(config.themePath, cssFiles + '.scss'))
    .pipe(sass.sync().on('error', function (e){
      console.error(e);
      spin.text = 'build failed';
      spin.fail();
    }))
    .pipe(autoprefixer({
      browsers: config.browsers,
      cascade: false
    }))
    .pipe((opts.minimize || config.minimize) ? cssmin({showLog: false}) : nop())
    .pipe(gulp.dest(opts.out || config.out))
    .on('end', function () {
      spin.succeed()
    })

  return stream
}


const writeFiles = function (opts, spinner) {
  const filesDir = path.resolve(process.cwd(), opts.config || config.config);
  let indexes = {};
  try {
    indexes = JSON.parse(fs.readFileSync(path.resolve(filesDir, './index.json')));
  } catch (e) {
    spinner.text('Failed to read index.json in your specified directory');
    return spinner.fail();
  }
  
  for (originalFile in indexes) {
    // 用于写入的新文件路径
    const newFile = path.resolve(filesDir, indexes[originalFile]);
    // 要写入的文件路径
    const originalPath  = path.resolve(config.themePath, originalFile);
    if (fs.existsSync(originalPath)) {
      // 备份原始文件（如果当前没有备份）
      const backupPath = path.resolve(path.parse(originalPath).dir,
              `${path.parse(originalPath).name}_original${path.parse(originalPath).ext}`);
      if (!fs.existsSync(backupPath)) {
        fs.writeFileSync(backupPath, fs.readFileSync(originalPath), 'utf-8');
      }
    }
    // 写入
    fs.writeFileSync(originalPath, fs.readFileSync(newFile), 'utf-8');
  }
}
