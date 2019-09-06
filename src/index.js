const router = require('./router')
const server = require('./server')
const buildRequest = require('./request').build
const buildResponse = require('./response').build

function felid (options = {}) {
  this.options = {
    contentType: 'application/json',
    ...options
  }

  this.middlewares = []
  this.routeMiddlewares = {}
  this.router = router({
    defaultRoute: (req, res) => {
      res.statusCode = 404
      res.end()
    }
  })
}

// middleware
felid.prototype.use = function (url, ...middle) {
  if (typeof url === 'function') {
    middle = url
    this.middlewares.push(middle)
  } else if (typeof url === 'string') {
    if (!this.routeMiddlewares[url]) {
      this.routeMiddlewares[url] = []
    }
    this.routeMiddlewares[url].push(...middle)
  }
}

// listen
felid.prototype.listen = function (port, callback) {
  this.server = server({}, (req, res) => {
    this.router.lookup(req, res)
  })
  this.server.listen(options, callback)
  this.port = port
}

const httpMethods = [
  'delete',
  'get',
  'head',
  'options',
  'patch',
  'post',
  'put',
  'trace'
]

// route
felid.prototype.on = function (method, url, handler) {
  return this.router.on(method, url, buildHanlder.call(this, url, handler))
}

felid.prototype.all = function (url, handler, store) {
  return this.router.all(url, buildHanlder.call(this, url, handler), store)
}

httpMethods.forEach(method => {
  felid.prototype[method] = function (url, handler) {
    return this.router[method](url, buildHanlder.call(this, url, handler))
  }
})

module.exports = felid

function buildHanlder (url, handler) {
  const middlewares = this.middlewares.concat(this.routeMiddlewares[url] || [])
  return async (req, res, params) => {
    req = await buildRequest(req, params)
    res = buildResponse(res)

    let index = 0
    function next () {
      if (middlewares[index]) {
        middlewares[index++](req, res, next)
      } else {
        handler(req, res)
      }
    }
    if (middlewares.length) {
      next()
    } else {
      handler(req, res)
    }
  }
}

// TODO: split handler, req, res
// TODO: parse body
// TODO: route middlewares
// TODO: hooks: handle error...
