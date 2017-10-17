var axios = require('axios');
var facebookProfileURL = 'https://graph.facebook.com/me';
var googleProfileURL = 'https://www.googleapis.com/oauth2/v1/userinfo';


exports.getGoogleProfile = function(access_token){
  return axios({
    method:'get',
    url: googleProfileURL,
    params: {access_token:access_token}
  })
};

exports.getFacebookProfile = function(access_token) {
  return axios({
    method:'get',
    url: facebookProfileURL,
    params: {access_token:access_token, fields:'email'}
  })
};