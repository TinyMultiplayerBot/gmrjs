var path = require('path');

var fsPromise = require('fs-promise');
var ini = require('ini');
var merge = require('merge');
var nomnom = require('nomnom');


var defaultConfig = {};
var cliConfig = nomnom
  .option('auth_key', {
    help: 'GMR Authorization key. Optional if specified in config file.',
    full: 'auth-key',
    metavar: 'KEY',
  })
  .parse();


function getConfig() {

  return fsPromise.readFile(path.join(process.env.HOME, '.gmrrc'))
  .then(function(data) {
    var fileConfig = ini.parse(data.toString());
    var mergedConfig = merge({}, defaultConfig, fileConfig, cliConfig);

    var errors = [];

    if (!('auth_key' in mergedConfig)) {
      errors.push('Authentication key is required.');
    }

    if (errors.length) {
      throw new Error(errors.join('\n'));
    }

    return mergedConfig;
  })
  .catch(function(err) {
    throw 'Invalid configuration.\n' + err.toString() + '\n' +
          'Docs are at https://github.com/mythmon/gmrjs/blob/master/README.md';
  });
}

module.exports = getConfig;
