import axios from "axios";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const api = axios.create({
  baseURL: Constants.expoConfig?.extra?.API_URL,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("justgo_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
