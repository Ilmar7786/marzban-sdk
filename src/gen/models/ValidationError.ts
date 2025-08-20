export type ValidationError = {
  /**
   * @type array
   */
  loc: (string | number)[]
  /**
   * @type string
   */
  msg: string
  /**
   * @type string
   */
  type: string
}
