import { observable } from 'mobx';
import config from '../config/config';

const host = config.api_host;
const cloudn_host = config.cloudn_host;
const odp_host = config.odp_host;

export const store = observable({

  api: host,
  cloudn_api: cloudn_host,
  odp_api: odp_host,
  auth: {
    token: null,
    refreshToken: null,
  },

  user: {
    username: null,
    nickname: null,
    email: null,
    phoneNumber: null,
    status: null,
  },

  isAuthorized: false,

  openedPage: null,

  alert: msg => {
    alert(msg);
  }
});

export default store;