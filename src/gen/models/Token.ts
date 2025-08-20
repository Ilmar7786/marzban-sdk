export type Token = {
  /**
   * @type string
   */
  access_token: string
  /**
   * @default "bearer"
   * @type string | undefined
   */
  token_type?: string
}
