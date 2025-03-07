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
  private authPromise: Promise<void> | null = null;

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
    this.subscription = new SubscriptionApi(
      this.configuration,
      undefined,
      this.client
    );
    this.userTemplate = new UserTemplateApi(
      this.configuration,
      undefined,
      this.client
    );

    this.setupInterceptors(config);
    this.authPromise = this.authenticate(config);
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
    this.authPromise = new Promise(async (resolve, reject) => {
      try {
        const admin = new AdminApi(this.configuration);
        const data = await admin.adminToken(config.username, config.password);
        if (data?.access_token) {
          this.configuration.accessToken = data.access_token;

          resolve();
        } else {
          reject(new Error("Failed to retrieve access token"));
        }
      } catch (error) {
        console.error("Authentication failed", error);
        reject(error);
      }
    });

    return this.authPromise;
  }

  private setupInterceptors(config: Config): void {
    this.client.interceptors.request.use(
      async (requestConfig) => {
        await this.waitForAuth();
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

  private async waitForAuth(): Promise<void> {
    if (this.authPromise) {
      await this.authPromise;
    }
  }

  private async handleUnauthorizedError(error: any, config: Config) {
    const errorConfig = error?.config;
    if (error?.response?.status === 401 && !errorConfig?.sent) {
      errorConfig.sent = true;
      try {
        await this.authenticate(config);
        const accessToken = this.configuration.accessToken;
        if (accessToken) {
          errorConfig.headers.authorization = `Bearer ${accessToken}`;
          return axios(errorConfig);
        }
      } catch (err) {
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
}
