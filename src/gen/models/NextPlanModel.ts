export type NextPlanModel = {
  data_limit?: number | null
  expire?: number | null
  /**
   * @default false
   * @type boolean | undefined
   */
  add_remaining_traffic?: boolean
  /**
   * @default true
   * @type boolean | undefined
   */
  fire_on_either?: boolean
}
