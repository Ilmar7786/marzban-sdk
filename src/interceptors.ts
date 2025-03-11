import { AxiosInstance } from "axios";
import { AuthService } from "./authService";

export const setupInterceptors = (
  client: AxiosInstance,
  authService: AuthService,
  config: { username: string; password: string }
) => {
  client.interceptors.request.use(
    async (requestConfig) => {
      await authService.waitForAuth();
      const accessToken = authService["configuration"].accessToken;
      requestConfig.headers.authorization = accessToken
        ? `Bearer ${accessToken}`
        : undefined;
      return requestConfig;
    },
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const errorConfig = error?.config;
      if (error?.response?.status === 401 && !errorConfig?.sent) {
        errorConfig.sent = true;
        try {
          await authService.authenticate(config.username, config.password);
          const accessToken = authService["configuration"].accessToken;
          if (accessToken) {
            errorConfig.headers.authorization = `Bearer ${accessToken}`;
            return client(errorConfig);
          }
        } catch (err) {
          return Promise.reject(err);
        }
      }
      return Promise.reject(error);
    }
  );
};
