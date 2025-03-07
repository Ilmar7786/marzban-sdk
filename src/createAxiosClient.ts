import axios, { AxiosInstance } from "axios";

export const createAxiosClient = (baseUrl: string): AxiosInstance => {
  return axios.create({ baseURL: baseUrl });
};
