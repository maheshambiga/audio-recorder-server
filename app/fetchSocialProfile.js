import axios from 'axios';
const facebookProfileURL = 'https://graph.facebook.com/me';
const googleProfileURL = 'https://www.googleapis.com/oauth2/v1/userinfo';


export const getGoogleProfile = (access_token) => {
  return axios({
    method:'get',
    url: googleProfileURL,
    params: {access_token}
  })
};

export const getFacebookProfile = (access_token) => {
  return axios({
    method:'get',
    url: facebookProfileURL,
    params: {access_token, fields:'email'}
  })
};