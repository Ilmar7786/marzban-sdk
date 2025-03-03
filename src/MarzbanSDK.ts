import axios, { AxiosInstance } from "axios";
import {
  Configuration,
  AdminApi,
  CoreApi,
  NodeApi,
  UserApi,
  SystemApi,
  DefaultApi,
  SubscriptionApi,
  UserTemplateApi,
} from "./generated-sources";

export interface Config {
  baseUrl: string;
  username: string;
  password: string;
}

export class MarzbanSDK {
  private client: AxiosInstance;
  private configuration: Configuration;
  admin: AdminApi;
  core: CoreApi;
  node: NodeApi;
  user: UserApi;
  system: SystemApi;
  default: DefaultApi;
  subscription: SubscriptionApi;
  userTemplate: UserTemplateApi;

  constructor(config: Config) {
    this.configuration = this.createConfiguration(config);
    this.client = this.createAxiosClient(config.baseUrl);

    this.admin = new AdminApi(this.configuration, undefined, this.client);
    this.core = new CoreApi(this.configuration, undefined, this.client);
    this.node = new NodeApi(this.configuration, undefined, this.client);
    this.user = new UserApi(this.configuration, undefined, this.client);
    this.system = new SystemApi(this.configuration, undefined, this.client);
    this.default = new DefaultApi(this.configuration, undefined, this.client);
    this.subscription = new SubscriptionApi(this.configuration, undefined, this.client);
    this.userTemplate = new UserTemplateApi(this.configuration, undefined, this.client);

    this.setupInterceptors(config);
    this.authenticate(config);
  }

  private createConfiguration(config: Config): Configuration {
    return new Configuration({
      basePath: config.baseUrl,
      username: config.username,
      password: config.password,
    });
  }

  private createAxiosClient(baseUrl: string): AxiosInstance {
    return axios.create({
      baseURL: baseUrl,
    });
  }

  private async authenticate(config: Config): Promise<void> {
    try {
      const data = await this.admin.adminToken(
        config.username,
        config.password
      );
      if (data?.access_token) {
        this.configuration.accessToken = data.access_token;
      }
    } catch (error) {
      console.error("Authentication failed", error);
    }
  }

  private setupInterceptors(config: Config): void {
    this.client.interceptors.request.use(
      (requestConfig) => {
        const accessToken = this.configuration.accessToken;
        requestConfig.headers.authorization = accessToken
          ? `Bearer ${accessToken}`
          : undefined;
        return requestConfig;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error) => this.handleUnauthorizedError(error, config)
    );
  }

  private async handleUnauthorizedError(error: any, config: Config) {
    const errorConfig = error?.config;
    if (error?.response?.status === 401 && !errorConfig?.sent) {
      errorConfig.sent = true;
      try {
        const data = await this.admin.adminToken(
          config.username,
          config.password
        );
        if (data?.access_token) {
          this.configuration.accessToken = data.access_token;
          errorConfig.headers.authorization = `Bearer ${data.access_token}`;
          return axios(errorConfig);
        }
      } catch (err) {
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
}
