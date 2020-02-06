const injectar = require('injectar')
const Felid = require('../src')

test('felid instance should be an object', () => {
  const instance = new Felid()

  expect(typeof instance).toBe('object')
})

describe('listen()', () => {
  test('felid.listen() should start the server on the given port', (done) => {
    const instance = new Felid()
    instance.listen(3000, () => {
      expect(instance.listening).toBe(true)
      expect(instance.address.port).toBe(3000)
      instance.close()
      done()
    })
  })

  test('felid.listen() without a callback', () => {
    const instance = new Felid()
    instance.listen(3000)
    expect(instance.listening).toBe(true)
    expect(instance.address.port).toBe(3000)
    instance.close()
  })
})

describe('addParser()', () => {
  test('felid.addParser should apply parser to body of given content-type', async () => {
    const instance = new Felid()
    instance.addParser('test/type', (req) => {
      return 'test'
    })
    instance.post('/test', (req, res) => {
      res.send(req.body)
    })

    let res
    res = await injectar(instance.lookup())
      .post('/test')
      .headers({ 'content-type': 'test/type' })
      .body('body')
      .end()
    expect(res.payload).toBe('test')

    res = await injectar(instance.lookup())
      .post('/test')
      .body('body')
      .end()
    expect(res.payload).toBe('body')
  })

  test('felid.addParser should apply parser to body of given list of content-type', async () => {
    const instance = new Felid()
    instance.addParser(['test/type', 'test/type-a'], (req) => {
      return 'test'
    })
    instance.post('/test', (req, res) => {
      res.send(req.body)
    })

    let res
    res = await injectar(instance.lookup())
      .post('/test')
      .headers({ 'content-type': 'test/type' })
      .body('body')
      .end()
    expect(res.payload).toBe('test')

    res = await injectar(instance.lookup())
      .post('/test')
      .headers({ 'content-type': 'test/type-a' })
      .body('body')
      .end()
    expect(res.payload).toBe('test')

    res = await injectar(instance.lookup())
      .post('/test')
      .body('body')
      .end()
    expect(res.payload).toBe('body')
  })

  test('felid.addParser should override the default parser of given content-type', (done) => {
    const instance = new Felid()
    instance.addParser('text/plain', (req) => {
      return 'test'
    })
    instance.post('/test', (req, res) => {
      res.send(req.body)
    })

    injectar(instance.lookup())
      .post('/test')
      .headers({ 'content-type': 'text/plain' })
      .body('body')
      .end((err, res) => {
        expect(err).toBe(null)
        expect(res.payload).toBe('test')
        done()
      })
  })

  test('felid.addParser should override the default parser', (done) => {
    const instance = new Felid()
    instance.addParser((req) => {
      return 'test'
    })
    instance.post('/test', (req, res) => {
      res.send(req.body)
    })

    injectar(instance.lookup())
      .post('/test')
      .body('body')
      .end((err, res) => {
        expect(err).toBe(null)
        expect(res.payload).toBe('test')
        done()
      })
  })

  test('felid.addParser should throw if parser is not a function', () => {
    const instance = new Felid()
    expect(() => {
      instance.addParser('test/type', 'parser')
    }).toThrow()
  })
})

describe('error handle', () => {
  test('handle error thrown by felid.preRequest()', (done) => {
    const instance = new Felid()
    instance.preRequest((req, res) => {
      throw new Error('Boom!')
    })
    instance.get('/test', (req, res) => {
      res.send('test')
    })

    injectar(instance.lookup())
      .get('/test')
      .end((err, res) => {
        expect(err).toBe(null)
        expect(res.statusCode).toBe(500)
        expect(res.payload).toBe('Boom!')
        done()
      })
  })

  test('handle error thrown by felid.use()', (done) => {
    const instance = new Felid()
    instance.use((req, res) => {
      throw new Error('Boom!')
    })
    instance.get('/test', (req, res) => {
      res.send('test')
    })

    injectar(instance.lookup())
      .get('/test')
      .end((err, res) => {
        expect(err).toBe(null)
        expect(res.statusCode).toBe(500)
        expect(res.payload).toBe('Boom!')
        done()
      })
  })
})

describe('options', () => {
  test('options.errorHandler should set error handler', (done) => {
    const instance = new Felid({
      errorHandler (err, req, res) {
        res.statusCode = 600
        res.end('custom error ' + err)
      }
    })
    instance.preRequest((req, res) => {
      throw new Error('Boom!')
    })
    instance.get('/test', (req, res) => {
      res.send('test')
    })

    injectar(instance.lookup())
      .get('/test')
      .end((err, res) => {
        expect(err).toBe(null)
        expect(res.statusCode).toBe(600)
        expect(res.payload).toBe('custom error Error: Boom!')
        done()
      })
  })
})