import axios from "axios";
import { API_BASE_URL } from "../constants/api";

export const login = async (credentials) => {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
  return response.data;
};

export const register = async (data) => {
  const response = await axios.post(`${API_BASE_URL}/auth/register`, data);
  return response.data;
};
