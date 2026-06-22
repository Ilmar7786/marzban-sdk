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
  // Preserve any base path prefix (e.g. deployments behind a reverse proxy at
  // `https://host/marzban`) instead of overwriting it, matching how Axios joins
  // baseURL + path for HTTP requests.
  const basePrefix = url.pathname.replace(/\/+$/, '')
  const suffix = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  url.pathname = `${basePrefix}${suffix}`
  url.searchParams.set('interval', interval.toString())
  url.searchParams.set('token', token)

  return url.toString()
}
