# azure-functions-middleware-cascade
A middleware cascade, like Express, Koa or Hapi, but for Azure Functions!

## Features
- Async/await middleware support
- [Cascade error capture](#Capturing-errors) (a.k.a. "catch middleware")
- `New!` [Execution order customization](#Customizing-execution-order) (in three phases)
- `New!` [Conditional middlewares](#Conditional-middlewares)
- `New!` [Middleware execution prevention](#Stoping-the-cascade-execution) (a.k.a. "stop signal")

## How to use

### Simplest usage

```
$ npm install --save azure-functions-middleware-cascade
```

```javascript
const AzFuncCascade = require('azure-functions-middleware-cascade');

module.exports = new AzFuncCascade()
  .use(async (context) => {
    context.res.body = { message: 'My first middleware!' };
  })
  .listen();
```

**Tips!**
- Always call `listen()` at the end of cascade
- Always use async functions as middlewares. This cascade module doesn't supports sync functions anymore, we are at 21th century.
- Do not return anything inside your middleware function, unless you want to [throw an error](#capturing-errors). Always use `context.res` to output what you need.

### Capturing errors

Errors thrown or anything returned by a middleware will stop the cascade execution and will call cascade's `catchFunction`.

A default `catchFunction` is set to log the error at Azure Function's context and to return a HTTP 500 status.

If you want to catch function, use the `catch()` method:

```javascript
const AzFuncCascade = require('azure-functions-middleware-cascade');
const app = new AzFuncCascade();

// app.use(...); // middlewares

app.catch((context, error) => {
  context.res.status = 404;
  context.res.headers['X-Message'] = error;
});

module.exports = app.listen();
```

### Customizing execution order

This module executes the middleware cascade in three phases. You can customize the execution phase of your middleware by passing a `phase` argument to `use()` or `useIf()` methods:

```javascript
app.use((context) => {
  context.log('This will be executed at the last phase');
}, app.Phases.POST_PROCESSING);

app.use((context) => {
  context.log('This will be executed at the first phase');
}, app.Phases.PRE_PROCESSING);

app.use((context) => {
  context.log('This will be executed at the second phase');
});
```

Phases constants to use as phase argument are exposed into cascade's property `Phases`:

```
app.Phases.PRE_PROCESSING => first phase
app.Phases.MAIN => second phase
app.Phases.POST_PROCESSING => last phase
```

### Conditional middlewares

You can conditionally execute a middleware by passing an evaluation function to the `useIf` method.

Example:

```javascript
const isPostRequest = (context) => context.req.method === 'POST';

app.useIf(isPostRequest, (context) => {
  context.log('This will be executed only if is a HTTP POST');
});
```

### Stoping the cascade execution

You can stop the cascade execution at any time by returning the second middleware argument, `STOP_SIGNAL`.

Example:

```javascript
app.useIf((context, STOP_SIGNAL) => {
  if (!req.query.access_token) {
    context.res.status = 401;

    return STOP_SIGNAL;
  }
});
```
