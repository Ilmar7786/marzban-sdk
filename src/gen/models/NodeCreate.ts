/**
 * @example [object Object]
 */
export type NodeCreate = {
  /**
   * @type string
   */
  name: string
  /**
   * @type string
   */
  address: string
  /**
   * @default 62050
   * @type integer | undefined
   */
  port?: number
  /**
   * @default 62051
   * @type integer | undefined
   */
  api_port?: number
  /**
   * @default 1
   * @type number | undefined
   */
  usage_coefficient?: number
  /**
   * @default true
   * @type boolean | undefined
   */
  add_as_new_host?: boolean
}
