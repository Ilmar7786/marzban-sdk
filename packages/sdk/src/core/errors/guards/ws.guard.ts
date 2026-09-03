import { WsError, WsOptionsError } from '../categories'

export const isWsOptionsError = (error: unknown): error is WsOptionsError => {
  return error instanceof WsOptionsError
}

export const isWsError = (error: unknown): error is WsError => {
  return error instanceof WsError
}
