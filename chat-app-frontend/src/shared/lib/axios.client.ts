import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { signOut } from "./supabase-auth";
import { supabase } from "./supabase.client";

const API_URL = import.meta.env.VITE_API_URL;

type RequestData = Record<string, unknown> | FormData | null;

const getAuthToken = async () => {
  // Get the current session from Supabase
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  return token ? `Bearer ${token}` : "";
};

// Singleton Instance Configuration (Created once, shared everywhere)
const http: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request Interceptor
http.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const authToken = await getAuthToken();
    config.headers = axios.AxiosHeaders.from({
      ...config.headers,
      Authorization: authToken,
    });
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

// Response Interceptor
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response } = error;
    if (response?.status === 401) {
      // Prevent redirect loops if signOut itself gets a 401
      if (!window.location.pathname.startsWith("/auth/sign-in")) {
        await signOut();
      }
    }
    return Promise.reject(error);
  },
);

/**
 * Exposes generic HTTP methods that forward structural type matrices to Axios.
 */
export const apiRequest = {
  get: <T = unknown>(
    url: string,
    config: AxiosRequestConfig = {},
  ): Promise<AxiosResponse<T>> => http.get<T>(url, config),

  post: <T = unknown>(
    url: string,
    data?: RequestData,
    config: AxiosRequestConfig = {},
  ): Promise<AxiosResponse<T>> => http.post<T>(url, data, config),

  put: <T = unknown>(
    url: string,
    data?: RequestData,
    config: AxiosRequestConfig = {},
  ): Promise<AxiosResponse<T>> => http.put<T>(url, data, config),

  patch: <T = unknown>(
    url: string,
    data?: RequestData,
    config: AxiosRequestConfig = {},
  ): Promise<AxiosResponse<T>> => http.patch<T>(url, data, config),

  delete: <T = unknown>(
    url: string,
    config: AxiosRequestConfig = {},
  ): Promise<AxiosResponse<T>> => http.delete<T>(url, config),
};

export default apiRequest;
