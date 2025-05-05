interface Options {
  basePath: string
  endpoint: string
  token: string
  interval: string | number
}

export const configurationUrlWs = ({ basePath, endpoint, interval, token }: Options) => {
  const url = new URL(basePath)
  const wsProtocol = url.protocol === 'https:' ? 'wss' : 'ws'

  url.protocol = wsProtocol
  url.pathname = endpoint
  url.searchParams.set('interval', interval.toString())
  url.searchParams.set('token', token)

  return url.toString()
}
