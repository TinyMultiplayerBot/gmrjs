var Promise = require('es6-promises');

function prompt(converter, validator) {

  process.stdout.write('> ');
  return new Promise(function(resolve, reject) {
    function listener(data) {
      var parsed = converter(data.toString().slice(0, -1));
      if (validator(parsed)) {
        process.stdin.removeListener('data', listener);
        resolve(parsed);
      } else {
        process.stdout.write('Invalid choice.\n> ');
      }
    }

    process.stdin.on('data', listener);
  });
}

function menu(choices) {
  if (!choices.length) {
    throw new Error("No choices given.");
  }
  if (!(choices[0] instanceof Array)) {
    choices = choices.map(function(x) { return [x, x]; });
  }
  choices.forEach(function(choice, i) {
    console.log((i + 1) + ') ' + choice[1]);
  });
  return prompt(parseInt, function(n) { return n >= 1 && n <= choices.length; })
  .then(function(choiceNum) {
    return choices[choiceNum - 1][0];
  });
}

module.exports = {
  prompt: prompt,
  menu: menu,
};
