var User = require('./models/models').User;

var checkToken = function(user) {
  var expiryDate = new Date(user.google.tokens.expiry_date);
  var today = new Date();
  if (today.getTime() - expiryDate.getTime() <= 0) {

  }
}

module.exports = checkToken;
