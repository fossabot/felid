const Felid = require('../src')

describe('plugin()', () => {
  test('felid.plugin()\'s callback function should recieve the Felid instance as first argument', () => {
    const instance = new Felid()
    instance.plugin((instance, options) => {
      instance.decorate('foo', 'bar')
    })

    expect(instance.foo).toBe('bar')
  })

  test('felid.plugin()\'s callback function should recieve the plugin options as second argument', () => {
    const instance = new Felid()
    instance.plugin((instance, options) => {
      instance.decorate(options.key, options.value)
    }, { key: 'foo', value: 'bar' })

    expect(instance.foo).toBe('bar')
  })

  test('felid.plugin() should handle async function correctly', () => {
    const instance = new Felid()
    instance.plugin(async (instance, options) => {
      return new Promise((resolve, reject) => {
        instance.decorate('foo', 'bar')
        resolve()
      })
    })

    expect(instance.foo).toBe('bar')
  })
})
