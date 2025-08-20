export type Admin = {
  /**
   * @type string
   */
  username: string
  /**
   * @type boolean
   */
  is_sudo: boolean
  telegram_id?: number | null
  discord_webhook?: string | null
  users_usage?: number | null
}
