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
  gmr = new GMR(config.auth_key);
  return gmr.get('/AuthenticateUser');
})
.then(function(playerId) {
  myPlayerId = playerId;
  console.log('You are playerId', myPlayerId);
  return gmr.get('/GetGamesAndPlayers', {playerIDText: playerId});
})
.then(function(gamesAndPlayers) {
  console.log('Pick a game');
  return ui.menu(gamesAndPlayers.games.map(function(game) {
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
  console.error('error', err.stack || err);
})
.then(process.exit);
