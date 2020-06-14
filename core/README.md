# azure-functions-middlewares
The most complete middleware solution for ⚡ Azure Functions.

![npm bundle size](https://img.shields.io/bundlephobia/min/@azure-functions-middlewares/core?label=package%20size)
![npm](https://img.shields.io/npm/dw/@azure-functions-middlewares/core)
![Libraries.io dependency status for latest release](https://img.shields.io/librariesio/release/npm/@azure-functions-middlewares/core)

## Features
- Async/await middleware support
- [Cascade error capture](#Capturing-errors) (a.k.a. "catch middleware")
- `New!` [Execution order customization](#Customizing-execution-order) (in three phases)
- `New!` [Conditional middlewares](#Conditional-middlewares)
- `New!` [Middleware execution prevention](#Stoping-the-cascade-execution) (a.k.a. "stop signal")

## How to use

### Simplest usage

Install latest core version at NPM ![npm](https://img.shields.io/npm/v/@azure-functions-middlewares/core)

```
$ npm install --save @azure-functions-middlewares/core
```
Listen to the cascade exporting it as the function entry point:

```javascript
const FunctionCascade = require('@azure-functions-middlewares/core');

module.exports = new FunctionCascade()
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
const FunctionCascade = require('@azure-functions-middlewares/core');
const app = new FunctionCascade();

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

## License

![GitHub](https://img.shields.io/github/license/noalvo/azure-functions-middlewares)
