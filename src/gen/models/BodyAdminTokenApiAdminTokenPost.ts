export type BodyAdminTokenApiAdminTokenPost = {
  grant_type?: string | null
  /**
   * @type string
   */
  username: string
  /**
   * @type string
   */
  password: string
  /**
   * @default ""
   * @type string | undefined
   */
  scope?: string
  client_id?: string | null
  client_secret?: string | null
}
