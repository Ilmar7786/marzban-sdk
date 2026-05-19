export type AdminModify = {
  password?: string | null
  /**
   * @type boolean
   */
  is_sudo: boolean
  telegram_id?: number | null
  discord_webhook?: string | null
}
