import axios, { AxiosInstance } from "axios";
import axiosRetry from "axios-retry";

interface Options {
  retries?: number
}

export const createAxiosClient = (baseUrl: string, options?: Options): AxiosInstance => {
  const client = axios.create({ baseURL: baseUrl });

  axiosRetry(client, { 
    retries: options?.retries ?? 3, 
    retryDelay: (retryCount) => retryCount * 1000
  });

  return client
};
