const path = require('path')
const fs = require('fs')
const ora = require('ora')
const config = require('./config')

exports.check = function () {
  if (!fs.existsSync(config.themePath)) {
    ora('please install `' + config.themeName + '`').fail()
    process.exit(1)
  }
}

/**
 * 从主题包中提取指定的源码文件
 * @param _sourceFile 要提取的源文件在主题包./src/目录下的绝对路径
 * @param _targetDir 要提取到的目录
 */
const extract = function (_sourceFile, _targetDir) {
  
  const spinner = ora(`Extract theme source file [${_sourceFile}] into ${_targetDir || config.config}`).start();
  let sourceFilePath = path.resolve(config.themePath, _sourceFile); // 源文件的绝对路径
  const targetDirectory = path.resolve(process.cwd(), _targetDir ? _targetDir : config.config) // 要提取到的目录
  const targetFileName = _sourceFile.replace(/\//g,'_'); // 提取到的目标文件名
  const targetFilePath = path.resolve(targetDirectory, targetFileName); // 提取到的目标文件的绝对路径
  
  // 检查要提取的源文件是否存在
  if (!fs.existsSync(sourceFilePath)) {
    spinner.text = `Source file [${_sourceFile}] does not exist, please check your input.`;
    spinner.fail();
    return;
  }
  
  // 如果不是scss文件，跳过
  if (path.parse(sourceFilePath).ext !== '.scss') {
    spinner.text = `Source file [${_sourceFile}] is not a scss file, skip`;
    spinner.fail();
    return;
  }
  
  // 如果输出的目标目录不存在，创建
  if (!fs.existsSync(targetDirectory)) {
      fs.mkdirSync(targetDirectory);
  }
  
  // 检查是否存在备份文件
  const parsedSourceFilePath = path.parse(sourceFilePath)
  const backupFilePath = path.resolve(parsedSourceFilePath.dir, `${parsedSourceFilePath.name}${config.backupSuffix}${parsedSourceFilePath.ext}`);
  if (fs.existsSync(backupFilePath)) {
    sourceFilePath = backupFilePath;
  }
  
  // 检查文件是否已被提取
  if (fs.existsSync(targetFilePath)) {
    spinner.text = 'Target file was already extracted.'
    spinner.fail();
    return;
  }
  
  // 通过索引文件管理提取出的文件与源文件的对应关系
  const fileIndexPath = path.resolve(targetDirectory, './index.json');
  let fileIndex = {}
  // 尝试读取已存在的索引文件
  if (fs.existsSync(fileIndexPath)) {
    try {
      fileIndex = JSON.parse(fs.readFileSync(fileIndexPath));
    } catch (e) {
      spinner.text = 'Index file is invalid, please check it.'
      spinner.fail();
      console.error(e);
      return;
    }
  }
  // 在索引文件中记录对应关系
  fileIndex[_sourceFile] = targetFileName;
  fs.writeFileSync(fileIndexPath, JSON.stringify(fileIndex, null, 2), 'utf-8');
  
  // 提取到目标文件
  if (!fs.existsSync(targetFilePath)) {
      fs.writeFileSync(targetFilePath, fs.readFileSync(sourceFilePath), 'utf-8');
  }
  spinner.succeed()
}
exports.extract = extract;

const extractAll = function (targetDir, sourceDir, dirPrefix = '') {
  const prefix = dirPrefix.length > 0 ? `${dirPrefix}/` : '';
  const current = path.resolve(config.themePath, sourceDir || '', prefix);
  const dirs = fs.readdirSync(current);
  dirs.forEach(dir => {
    const stats = fs.statSync(path.resolve(current, dir));
    if (stats.isDirectory()) {
      extractAll(targetDir || config.config, sourceDir || '', `${prefix}${dir}`);
      return;
    }
    const sourceFile = sourceDir ? `${sourceDir}/${prefix}${dir}` : `${prefix}${dir}`;
    extract(sourceFile, targetDir || config.config);
  })
}

exports.extractAll = extractAll;