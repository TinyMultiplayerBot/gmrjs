#!/usr/bin/env node
var path = require('path');

var fs = require('fs-promise');
var Promise = require('es6-promises');
var request = require('request');
var ini = require('ini');

var GMR = require('./lib/gmr');
var ui = require('./lib/ui');


var gmr;
var config;
var myPlayerId;


fs.readFile(path.join(process.env.HOME, '.gmrrc'))
.then(function(data) {
  config = ini.parse(data.toString());
  if (!('auth_key' in config)) {
    throw new Error('Invalid configuration: auth_key is required.');
  }
  gmr = new GMR(config.auth_key);
})
.catch(function(err) {
  throw err.toString() + '\n' +
        'Docs are at https://github.com/mythmon/gmrjs/blob/master/README.md';
})
.then(function() {
  return gmr.get('/AuthenticateUser');
})
.then(function(playerId) {
  myPlayerId = playerId;
  console.log('You are playerId', myPlayerId);
  return gmr.get('/GetGamesAndPlayers', {playerIDText: playerId});
})
.then(function(gamesAndPlayers) {
  console.log('Pick a game');
  return ui.menu(gamesAndPlayers.Games.map(function(game) {
    var msg = game.Name + ' - ' + game.CurrentTurn.UserId + ' - ';
    game.myTurn = game.CurrentTurn.UserId === myPlayerId;
    msg += game.myTurn ? 'Your turn' : ' Wait';
    return [game, msg];
  }).concat([['exit', 'Exit']]));
})
.then(function(game) {
  if (game === 'exit') {
    return;
  }
  if (!game.myTurn) {
    console.log("It's not your turn in that game!");
  } else {
    console.log('Downloading');
    var localFile = fs.createWriteStream('./GMR - ' + game.Name + '.Civ5Save');
    return new Promise(function(resolve, reject) {
      var download = gmr.makeRequest('/GetLatestSaveFileBytes', {gameId: game.GameId}, function(err, req, body) {
        if (err) {
          reject(err);
        } else if (req.statusCode !== 200) {
          reject(body);
        } else {
          resolve();
        }
      });
      download.pipe(localFile);
    })
    .catch(function(err) {
      localFile.close();
      fs.unlink(localFile.path);
      throw err;
    });
  }
})
.catch(function(err) {
  console.error(err.stack || err);
  process.exit(1);
})
.then(function() {
  process.exit(0);
});
