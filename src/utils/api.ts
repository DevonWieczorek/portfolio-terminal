// src/utils/api.ts

import axios from "axios";

const api = axios.create({
  baseURL: "https://api.openai.com/v1/",
  headers: {
    Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
    "Content-Type": "application/json",
  },
});

export default api;
