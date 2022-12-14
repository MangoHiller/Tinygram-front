import axios from 'axios';

const instance = axios.create({
  baseURL:
    process.env.NODE_ENV == 'production'
      ? 'https://tinygram-2022-2023.ew.r.appspot.com/_ah/api/tinyinsta/v1'
      : 'http://localhost:8080/_ah/api/tinyinsta/v1',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

export default instance;
