export type UserTemplateResponse = {
  name?: (string | null) | null
  /**
   * @description data_limit can be 0 or greater
   */
  data_limit?: number | null
  /**
   * @description expire_duration can be 0 or greater in seconds
   */
  expire_duration?: number | null
  username_prefix?: string | null
  username_suffix?: string | null
  /**
   * @default [object Object]
   * @type object | undefined
   */
  inbounds?: {
    [key: string]: string[]
  }
  /**
   * @type integer
   */
  id: number
}
