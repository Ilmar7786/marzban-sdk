import { AxiosInstance } from "axios";
import { Configuration, AdminApi, CoreApi, NodeApi, UserApi, SystemApi, DefaultApi, SubscriptionApi, UserTemplateApi } from "./generated-sources";
import { createAxiosClient } from "./createAxiosClient";
import { AuthService } from "./authService";
import { setupInterceptors } from "./interceptors";
import { LogsApi } from "./LogsApi";

/**
 * Configuration interface for MarzbanSDK.
 * 
 * @property {string} baseUrl - The base URL of the API.
 * @property {string} username - The username for authentication.
 * @property {string} password - The password for authentication.
 * @property {string} [token] - Optional JWT token used for direct authorization if already authenticated.
 * @property {number} [retries] - Optional number of retries for failed requests.
 */
export interface Config {
  baseUrl: string;
  username: string;
  password: string;
  token?: string
  retries?: number
}

/**
 * The main SDK class for interacting with the Marzban API.
 * 
 * This class provides access to various API modules (e.g., Admin, Core, Node, etc.)
 * and handles authentication, request retries, and interceptor setup.
 */
export class MarzbanSDK {
  private client: AxiosInstance;
  private configuration: Configuration;
  private authService: AuthService;

  /**
   * API module for administrative operations.
   */
  admin: AdminApi;

  /**
   * API module for core operations.
   */
  core: CoreApi;

  /**
   * API module for node-related operations.
   */
  node: NodeApi;

  /**
   * API module for user-related operations.
   */
  user: UserApi;

  /**
   * API module for system-related operations.
   */
  system: SystemApi;

  /**
   * API module for default operations.
   */
  default: DefaultApi;

  /**
   * API module for subscription-related operations.
   */
  subscription: SubscriptionApi;

  /**
   * API module for user template operations.
   */
  userTemplate: UserTemplateApi;

  /**
   * API module for logs-related operations.
   */
  logs: LogsApi;

  /**
   * Creates an instance of MarzbanSDK.
   * 
   * @param {Config} config - The configuration object for the SDK.
   * @param {string} config.baseUrl - The base URL of the API.
   * @param {string} config.username - The username for authentication.
   * @param {string} config.password - The password for authentication.
   * @param {string} [config.token] - Optional JWT token used for direct authorization if already authenticated.
   * @param {number} [config.retries] - Optional number of retries for failed requests.
   */
  constructor(config: Config) {
    this.configuration = new Configuration({
      basePath: config.baseUrl,
      username: config.username,
      password: config.password,
      accessToken: config.token
    });

    this.client = createAxiosClient(config.baseUrl, { retries: config.retries });
    this.authService = new AuthService(this.configuration);

    this.admin = new AdminApi(this.configuration, config.baseUrl, this.client);
    this.core = new CoreApi(this.configuration, config.baseUrl, this.client);
    this.node = new NodeApi(this.configuration, config.baseUrl, this.client);
    this.user = new UserApi(this.configuration, config.baseUrl, this.client);
    this.system = new SystemApi(this.configuration, config.baseUrl, this.client);
    this.default = new DefaultApi(this.configuration, config.baseUrl, this.client);
    this.subscription = new SubscriptionApi(this.configuration, config.baseUrl, this.client);
    this.userTemplate = new UserTemplateApi(this.configuration, config.baseUrl, this.client);
    this.logs = new LogsApi(config.baseUrl, this.authService)

    setupInterceptors(this.client, this.authService, config);

    if (!config.token) {
      this.authService.authenticate(config.username, config.password);
    }
  }

  /**
   * Retrieves the current authentication token.
   *
   * @returns {Promise<string>} The JWT token currently in use, or empty string if no token is available.
   */
  async getAuthToken(): Promise<string> {
    await this.authService.waitForAuth()
    return this.authService.accessToken
  }
}
