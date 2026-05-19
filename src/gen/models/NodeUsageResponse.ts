export type NodeUsageResponse = {
  node_id?: number | null
  /**
   * @type string
   */
  node_name: string
  /**
   * @type integer
   */
  uplink: number
  /**
   * @type integer
   */
  downlink: number
}
