var fs = require('fs');

var request = require('request');
var Promise = require('es6-promises');


var gmrApiUrl = 'http://multiplayerrobot.com/api/Diplomacy';


function GMR(token) {
  this.token = token;
}

GMR.prototype.makeUrl = function(endpoint, query) {
  query = query || {};
  if (!('authKey' in query)) {
    query.authKey = this.token;
  }
  var qs = [];
  for (var key in query) {
    qs.push(key + '=' + encodeURIComponent(query[key]));
  }
  qs = '?' + qs.join('&');
  return gmrApiUrl + endpoint + qs;
};

GMR.prototype.makeRequest = function(endpoint, query, cb) {
  var url = this.makeUrl(endpoint, query);
  return request.get(url, cb);
};

GMR.prototype.get = function(endpoint, query) {
  var self = this;
  return new Promise(function(resolve, reject) {
    self.makeRequest(endpoint, query, function(err, req, body) {
      if (err) {
        return reject(err);
      }

      try {
        body = JSON.parse(body);
      } catch(e) {
        console.error('JSON parse error. Body is', body);
        return reject(e);
      }

      if (req.statusCode >= 400) {
        var e;
        try {
          e = new Error(req.statusCode + ' ' + body.Message + ' ' + body.MessageDetail);
        } catch(_) {
          e = new Error(body);
        }
        e.statusCode = req.statusCode;
        reject(e);
      } else {
        resolve(body);
      }
    });
  });
};

GMR.prototype.getGamesAndPlayers = function(playerIDs) {
  var playerIDText = playerIDs.join('_');
  return this.get('/GetGamesAndPlayers', {playerIDText: playerIDText});
};

GMR.prototype.getPlayerID = function() {
  return this.get('/AuthenticateUser');
};

GMR.prototype.downloadSave = function(gameId, path) {
  var localFile = fs.createWriteStream(path);

  return new Promise(function(resolve, reject) {
    var download = this.makeRequest('/GetLatestSaveFileBytes', {gameId: gameId}, function(err, req, body) {
      if (err) {
        reject(err);
      } else if (req.statusCode >= 400) {
        reject(body);
      } else {
        resolve();
      }
    });
    download.pipe(localFile);
  }.bind(this))
  .catch(function(err) {
    localFile.close();
    try {
      fs.unlink(localFile.path);
    } catch(e) {
      // pass
    }
    throw err;
  });
};

module.exports = GMR;
