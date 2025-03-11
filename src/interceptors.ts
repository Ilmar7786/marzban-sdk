import { AxiosInstance } from "axios";

import { AuthService } from "./authService";

/**
 * Sets up interceptors for the Axios client.
 *
 * @param client - The Axios instance to set up interceptors for.
 * @param authService - The authentication service instance.
 * @param config - The configuration object containing authentication details.
 * @param config.username - The username for authentication.
 * @param config.password - The password for authentication.
 */
export const setupInterceptors = (
  client: AxiosInstance,
  authService: AuthService,
  config: { username: string; password: string }
) => {
  client.interceptors.request.use(
    async (requestConfig) => {
      await authService.waitForAuth();
      const accessToken = authService.accessToken;
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
      const retryConfig = error?.config;
      if (error?.response?.status === 401 && !retryConfig?.sent) {
        retryConfig.sent = true;
        try {
          await authService.authenticate(config.username, config.password);
          const accessToken = authService.accessToken;
          if (accessToken) {
            retryConfig.headers.authorization = `Bearer ${accessToken}`;
            return client(retryConfig);
          }
        } catch (err) {
          return Promise.reject(err);
        }
      }
      return Promise.reject(error);
    }
  );
};
