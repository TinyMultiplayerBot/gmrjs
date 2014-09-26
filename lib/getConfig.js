var path = require('path');

var fsPromise = require('fs-promise');
var ini = require('ini');
var merge = require('merge');
var nomnom = require('nomnom');
var expandHomeDir = require('expand-home-dir');
var Promise = require('es6-promises')


var defaultConfig = {
  save_path: '.',
};

var cliConfig = nomnom
  .option('auth_key', {
    help: 'GMR Authorization key. Optional if specified in config file.',
    full: 'auth-key',
    metavar: 'KEY',
  })
  .option('save_path', {
    help: 'Where to put save files on download. Defaults to the current directory.',
    full: 'save-path',
    metavar: 'DIR',
  })
  .parse();


// All files that exist will be read and their configurations will be merged.
// Paths that come earlier in this array have lower priority.
var configPaths = [
  '/etc/gmrrc',
  '~/.gmrrc',
  '~/.gmrjs.rc',
  '~/.config/gmrrc',
  '~/.config/gmrjs.rc',
].map(expandHomeDir);


function getConfig() {

  return Promise.all(configPaths.map(readConfigFile))
  .then(function(fileConfigs) {
    var allConfigs = [{}, defaultConfig].concat(fileConfigs, [cliConfig]);
    return merge.apply(null, allConfigs);
  })
  .then(validateConfig)
  .catch(function(err) {
    throw 'Invalid configuration.\n' +
          err.toString() + '\n' +
          'Docs are at https://github.com/mythmon/gmrjs/blob/master/README.md';
  });
}

function readConfigFile(path) {
  return fsPromise.readFile(path)
  .then(function(data) {
    return ini.parse(data.toString());
  })
  .catch(function(err) {
    return {};
  });
}

function validateConfig(config) {
  var errors = [];

  if (!('auth_key' in config)) {
    errors.push('Authentication key is required.');
  }

  if ('save_path' in config) {
    config.save_path = expandHomeDir(config.save_path);
  }

  if (errors.length) {
    throw new Error(errors.join('\n'));
  }

  return config;
}

getConfig.readConfigFile = readConfigFile;

module.exports = getConfig;
