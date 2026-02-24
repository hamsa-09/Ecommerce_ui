import axiosInstance from "../utils/axiosInstance";

export const getResources = async (params) => {
  const response = await axiosInstance.get("/resources", { params });
  return response.data;
};

export const getResourceById = async (id) => {
  const response = await axiosInstance.get(`/resources/${id}`);
  return response.data;
};

export const createResource = async (data) => {
  const response = await axiosInstance.post("/resources", data);
  return response.data;
};

export const updateResource = async (id, data) => {
  const response = await axiosInstance.put(`/resources/${id}`, data);
  return response.data;
};

export const deleteResource = async (id) => {
  await axiosInstance.delete(`/resources/${id}`);
};
