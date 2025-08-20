export type SystemStats = {
  /**
   * @type string
   */
  version: string
  /**
   * @type integer
   */
  mem_total: number
  /**
   * @type integer
   */
  mem_used: number
  /**
   * @type integer
   */
  cpu_cores: number
  /**
   * @type number
   */
  cpu_usage: number
  /**
   * @type integer
   */
  total_user: number
  /**
   * @type integer
   */
  online_users: number
  /**
   * @type integer
   */
  users_active: number
  /**
   * @type integer
   */
  users_on_hold: number
  /**
   * @type integer
   */
  users_disabled: number
  /**
   * @type integer
   */
  users_expired: number
  /**
   * @type integer
   */
  users_limited: number
  /**
   * @type integer
   */
  incoming_bandwidth: number
  /**
   * @type integer
   */
  outgoing_bandwidth: number
  /**
   * @type integer
   */
  incoming_bandwidth_speed: number
  /**
   * @type integer
   */
  outgoing_bandwidth_speed: number
}
