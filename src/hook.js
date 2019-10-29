const assert = require('assert')
const {
  HOOK_PRE_REQUEST,
  HOOK_MIDDLE,
  HOOK_POST_RESPONSE
} = require('./constants')

const availableHooks = [
  HOOK_PRE_REQUEST,
  HOOK_MIDDLE,
  HOOK_POST_RESPONSE
]

function Hooks () {
  this.hookMap = new Map()
  this.routeHookMap = new Map()
  this.cache = new Map()
  availableHooks.forEach(hookName => {
    this.cache.set(hookName, new Map())
  })
}

Hooks.prototype.add = function (hookName, url, ...handlers) {
  if (typeof url === 'function') {
    handlers = [url, ...handlers]
    url = undefined
  }
  assert.ok(availableHooks.includes(hookName), `Invalid hook: ${hookName}`)
  if (url === undefined) {
    addHandlers(this.hookMap, hookName, handlers)
  } else if (typeof url === 'string') {
    if (!this.routeHookMap.has(url)) {
      this.routeHookMap.set(url, new Map())
    }
    addHandlers(this.routeHookMap.get(url), hookName, handlers)
  } else {
    assert.ok(Array.isArray(url), 'Url attached to the hook must be a string or an array of string')
    url.forEach(path => {
      assert.strictEqual(typeof path, 'string', 'Url in array attached to the hook must be a string')
      this.add(hookName, path, ...handlers)
    })
  }
}

Hooks.prototype.get = function (hookName, url) {
  const hookCache = this.cache.get(hookName)
  function endHooks () {
    hookCache.set(url, [])
    return []
  }

  if (hookCache.has(url)) {
    return hookCache.get(url)
  }
  if (!this.hookMap.has(hookName) && !this.routeHookMap.has(url)) {
    return endHooks()
  }
  const fns = concatHooks(this.hookMap, this.routeHookMap, hookName, url)
  if (!fns || !fns.length) {
    return endHooks()
  }
  hookCache.set(url, fns)
  return fns
}

Hooks.prototype.run = function (hookName, url, ...args) {
  const fns = this.get(hookName, url)
  return runHooks(fns, ...args)
}

module.exports = Hooks

function addHandlers (map, name, handlers) {
  if (!map.has(name)) {
    map.set(name, [])
  }
  const arr = map.get(name)
  handlers.forEach(handler => {
    assert.strictEqual(typeof handler, 'function', `Handler for '${name}' hook should be a function`)
    arr.push(handler)
  })
}

function concatHooks (hookMap, routeHookMap, name, url) {
  const globalHooks = hookMap.get(name) || []
  if (!url || !routeHookMap.has(url)) {
    return globalHooks
  }
  return globalHooks.concat(routeHookMap.get(url).get(name))
}

function runHooks (hooks, ...args) {
  let index = 0
  async function next () {
    if (typeof hooks[index] === 'function') {
      await hooks[index++](...args, next)
      return next()
    }
    return Promise.resolve()
  }
  return next()
}
