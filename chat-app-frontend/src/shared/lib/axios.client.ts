import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { authClient } from "./better-auth.client";

const API_URL = import.meta.env.VITE_API_URL;

type ApiRequestOptions = {
  url?: string;
  config?: AxiosRequestConfig;
};

type RequestData = Record<string, unknown> | FormData | null;

export const apiRequest = ({ url = "", config = {} }: ApiRequestOptions) => {
  const headers = {
    Accept: "application/json",
  };

  const http: AxiosInstance = axios.create({
    ...config,
    baseURL: API_URL,
    headers,
    withCredentials: true, // Crucial for Better-Auth session cookies
  });

  // Request interceptor
  http.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      return config;
    },
    (error) => Promise.reject(error),
  );

  // Response interceptor
  http.interceptors.response.use(
    (response) => response,
    async (error) => {
      const { response } = error;
      if (response?.status === 401) {
        authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              window.location.href = "/auth/sign-in";
            },
          },
        });
      }
      return Promise.reject(error);
    },
  );

  const httpRequest = (
    requestConfig: AxiosRequestConfig = {},
  ): Promise<AxiosResponse> => {
    return http({
      url,
      ...config,
      ...requestConfig,
    });
  };

  const get = (
    requestConfig: AxiosRequestConfig = {},
  ): Promise<AxiosResponse> => httpRequest({ method: "get", ...requestConfig });

  const post = (
    data: RequestData,
    requestConfig: AxiosRequestConfig = {},
  ): Promise<AxiosResponse> =>
    httpRequest({ method: "post", data, ...requestConfig });

  const put = (
    data: RequestData,
    requestConfig: AxiosRequestConfig = {},
  ): Promise<AxiosResponse> =>
    httpRequest({ method: "put", data, ...requestConfig });

  const patch = (
    data: RequestData,
    requestConfig: AxiosRequestConfig = {},
  ): Promise<AxiosResponse> =>
    httpRequest({ method: "patch", data, ...requestConfig });

  const remove = (
    requestConfig: AxiosRequestConfig = {},
  ): Promise<AxiosResponse> =>
    httpRequest({ method: "delete", ...requestConfig });

  return {
    get,
    post,
    put,
    patch,
    delete: remove,
  };
};

export default apiRequest;
