import { AxiosInstance } from "axios";
import { Configuration, AdminApi, CoreApi, NodeApi, UserApi, SystemApi, DefaultApi, SubscriptionApi, UserTemplateApi } from "./generated-sources";
import { createAxiosClient } from "./createAxiosClient";
import { AuthService } from "./authService";
import { setupInterceptors } from "./interceptors";

/**
 * Configuration interface for MarzbanSDK.
 * 
 * @property {string} baseUrl - The base URL for the API.
 * @property {string} username - The username for authentication.
 * @property {string} password - The password for authentication.
 * @property {number} [retries] - Optional number of retries for failed requests.
 */
export interface Config {
  baseUrl: string;
  username: string;
  password: string;
  retries?: number
}

export class MarzbanSDK {
  private client: AxiosInstance;
  private configuration: Configuration;
  private authService: AuthService;

  admin: AdminApi;
  core: CoreApi;
  node: NodeApi;
  user: UserApi;
  system: SystemApi;
  default: DefaultApi;
  subscription: SubscriptionApi;
  userTemplate: UserTemplateApi;

  constructor(config: Config) {
    this.configuration = new Configuration({
      basePath: config.baseUrl,
      username: config.username,
      password: config.password,
    });

    this.client = createAxiosClient(config.baseUrl, { retries: config.retries });
    this.authService = new AuthService(this.configuration);

    this.admin = new AdminApi(this.configuration, undefined, this.client);
    this.core = new CoreApi(this.configuration, undefined, this.client);
    this.node = new NodeApi(this.configuration, undefined, this.client);
    this.user = new UserApi(this.configuration, undefined, this.client);
    this.system = new SystemApi(this.configuration, undefined, this.client);
    this.default = new DefaultApi(this.configuration, undefined, this.client);
    this.subscription = new SubscriptionApi(this.configuration, undefined, this.client);
    this.userTemplate = new UserTemplateApi(this.configuration, undefined, this.client);

    setupInterceptors(this.client, this.authService, config);
    this.authService.authenticate(config.username, config.password);
  }
}
