export type HandleCloseConnection = () => void

/** Mutable close handle for one logical stream — a retry repoints `.close` at the replacement socket. */
export interface ConnectionHandle {
  close: HandleCloseConnection
}
