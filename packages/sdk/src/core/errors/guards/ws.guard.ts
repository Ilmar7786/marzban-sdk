import { WsOptionsError } from '../categories'

export const isWsOptionsError = (error: unknown): error is WsOptionsError => {
  return error instanceof WsOptionsError
}
