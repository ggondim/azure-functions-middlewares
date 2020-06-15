<h1 align="center">
  <br>
  Azure Functions Middlewares
  <br>
</h1>

<p align="center">The most complete middleware solution for ⚡ Azure Functions.</p>

<p align="center">
  <img src="https://img.shields.io/npm/v/azure-functions-middlewares" />
  <img src="https://img.shields.io/bundlephobia/min/azure-functions-middlewares" />
  <img src="https://img.shields.io/github/last-commit/ggondim/azure-functions-middlewares" />
</p>

> Azure Functions Middlewares is a full HTTP middleware cascade solution if you need to evolute your Azure Functions to composition and reusability, as you did before on APIs powered by Express, Koa or HAPI. 

See all [features](#features).

## Table of contents

* [Installation](#Installation)
  * [Requirements](#Requirements)
  * [Installing](#Installing)
    * [Via package manager](#Via-package-manager)
    * [Unpkg](#Unpkg)
* [Usage](#Usage)
  * [TL;DR - The most simple usage](#TLDR)
  * [Advanced usage](#Advanced-usage)
* [Extending](#Extending)
* [Help](#Help)
  * [FAQ](#FAQ)
  * [Support](#Support)
* [API](#API)
* [Technical concepts](#Tecnhical-concepts)
  * [Related projects](#Related-projects)
  * [Similar projects](#Similar-projects)
* [Contributing](#Contributing)
  * [If you don't want to code](#If-you-don-t-want-to-code)
    * [Star the project](#Star-the-project)
    * [Tweet it](#Tweet-it)
    * [Donate](#Donate)
  * [If you want to code](#If-you-want-to-code)
    * [Code of conduct](#Code-of-conduct)
    * [SemVer](#SemVer)
    * [Roadmap](#Roadmap)
* [Hall of fame](#Hall-of-fame)
* [License](#License)

---

## Installation

### Requirements

![](https://img.shields.io/static/v1?label=npm&message=6.14.5&color=brightgreen) ![](https://img.shields.io/static/v1?label=node&message=12.16.3&color=brightgreen) ![](https://img.shields.io/static/v1?label=os&message=ubuntu-20.04&color=blueviolet) ![](https://img.shields.io/static/v1?label=platforms&message=node&color=777) 

Azure Functions Middlewares was tested for the environments below. Even we believe it may works in older versions or other platforms, **it is not intended to**.

<details>
  <summary><b>See tested environments</b></summary>

| Environment  |  Tested version  |
| ------------------- | ------------------- |
|  OS |  Ubuntu 20.04 |
|  Node.js |  12.16.3 |
|  Package Manager |  npm 6.14.5 |
|  Platforms |  server, **browser not supported** |

</details>

### Installing

#### Via package manager

![](https://nodei.co/npm/azure-functions-middlewares.png?downloads=true&downloadRank=true&stars=true)


```shell
$ npm install --save azure-functions-middlewares
```

<br/>

<p align="right"><a href="#Table-of-contents">↟ Back to top</a></p>

---

## Usage

![](https://img.shields.io/static/v1?label=modules&message=ES%20Modules%20|%20CommonJS&color=yellow) 
![](https://img.shields.io/static/v1?label=javascript&message=ECMA2015&color=yellow) 

### TL;DR

The most simple usage

```javascript
const FunctionMiddlewares = require('azure-functions-middlewares');

const app = new FunctionMiddlewares();

app.use(async (context) => {

});

module.exports = app.listen();
```

> **⚠&nbsp;&nbsp;Things you must pay attention**
> - Always call `listen()` at the end of cascade to return the function entrypoint.
> - Always use async functions as middlewares. **This project doesn't supports sync functions anymore,** we are at 21th century.
> - **Do not return anything inside your middleware function**, unless you want to [throw an error](#Capturing-errors). Always use `context.res` to output what you need. If you want to pass values to the next middlewares, [use the context object reference](#Accessing-and-modifying-the-context).

<p align="right"><a href="#Table-of-contents">↟ Back to top</a></p>

---

### Capturing errors

If the middleware cascade encounters an error thrown by any middleware, it will stop the execution and will call the middleware registered with `catch()` method.

You can **register a callback middleware to catch errors thrown in middleware cascade** by passing a synchronous function with the arguments `(context, error)` , e.g.:

```javascript
app.catch(async (context, error) => {
  context.res.status = 404;
  context.res.headers['X-Message'] = error;
});
```

If you don't register any catch middleware, a default function will be registered to log the error using `context.error()` and also to set a HTTP 500 status code.

<p align="right"><a href="#Table-of-contents">↟ Back to top</a></p>

---

### Customizing the execution order

The middleware cascade is executed in three different phases: pre-execution, main execution and post-execution.

By default, all middlewares are pushed to the main execution phase, but you can **customize the phase you are adding a middleware** by passing a `phase` argument when registering a middleware using `use()` or `useIf()`:

```javascript
app.use(async (context) => {
  context.log('This will be executed at the last phase');
}, app.Phases.POST_PROCESSING);

app.use(async (context) => {
  context.log('This will be executed at the first phase');
}, app.Phases.PRE_PROCESSING);

app.use(async (context) => {
  context.log('This will be executed at the second phase');
});
```

Phases constants to use as phase argument are exposed into cascade's property `Phases`:

``` javascript
app.Phases.PRE_PROCESSING // => first phase
app.Phases.MAIN // => second phase
app.Phases.POST_PROCESSING // => last phase
```

> ℹ These constant values are equal to its enums keys. So, the `PRE_PROCESSING` constant is equal to a `"PRE_PROCESSING"` string.

<p align="right"><a href="#Table-of-contents">↟ Back to top</a></p>

---

### Conditional middlewares

**You can conditionally using the method `useIf()` instead the traditional `use()` method.**

To specify the evaluation function, pass to the first argument a synchronous function `(context) => {}` that always returns a boolean value.

Example:

```javascript
const isPostRequest = (context) => context.req.method === 'POST';

app.useIf(isPostRequest, async (context) => {
  context.log('This will be executed only if is a HTTP POST');
});
```

<p align="right"><a href="#Table-of-contents">↟ Back to top</a></p>

---

### Stoping the cascade execution

You can **stop the cascade execution and prevent next middlewares to be executed** in any following middleware, by returning the `STOP_SIGNAL` in the middleware.

It is useful when a middleware is used to validate the request before return any resource, just like Content-Type negotiation, authorization, etc.

The `STOP_SIGNAL` constant is avaiable as the second middleware's argument.

Example:

```javascript
app.use(async (context, STOP_SIGNAL) => {
  if (!req.query.access_token) {
    context.res.status = 401;

    return STOP_SIGNAL;
  }
});
```

> ℹ The `STOP_SIGNAL` constant value are equal to a `"!STOP!"` string.

<p align="right"><a href="#Table-of-contents">↟ Back to top</a></p>

---

### Accessing and modifying the `context`

> 1️⃣&nbsp;&nbsp;**The `context` argument available in middlewares is the untouched reference to the [Azure Function Context object](https://github.com/Azure/azure-functions-nodejs-worker/blob/master/types/public/Interfaces.d.ts#L18).**

This means you can **access the request** using `context.req` property, and also **set the response** using `context.res` property.

By default, `context.res` and `context.res.headers` are always initialized with empty objects `{}` to prevent attributions to `undefined`.

> 2️⃣&nbsp;&nbsp;**The `context` argument is an object reference and added properties are available through other references.**

This means you can **add your own custom properties** to make them available to other middlewares.

For example, you could make an "User" property available to use user's information:

```javascript
app.use(async (context) => {
  context.user = await database.getUser(context.req.query.userId);
});

app.use(async (context) => {
  context.res.body = await database.getOrdersByUser(context.user);
});
```

> 3️⃣&nbsp;&nbsp;**Azure Functions supports async functions and Azure Functions Middlewares handles everything needed in the function entrypoint generated by `app.listen()` method.**

So, **never call `context.done()`**.

<p align="right"><a href="#Table-of-contents">↟ Back to top</a></p>

---

## Extending

### Writing and publishing common middlewares

When we are talking about HTTP, some common middlewares is used by a lot of developers, just like authorization validation, content-type negotiation, parsing and output, and many more.

Azure Functions Middlewares doesn't have an API to extend it, because the middleware approach itself is extensible.

So, if you want to publish a middleware (or an evaluation function) you developed and think it will be useful for any other developer, fork this repository, add your middleware folder to the `middlewares` directory and make a pull request!

We will review it and publish it to the NPM scope `@azure-functions-middlewares`.

### Avaiable community middlewares

* **[@azure-functions-middlewares/jwt](/tree/master/jwt)**: Validates JWTs in `Authorization` request header (RFC 6750).
* **[@azure-functions-middlewares/mongodb](/tree/master/mongodb)**: Opens a MongoDB connection at the beggining of middleware cascade, makes it avaiable in any middleware at the `context` variable and closes it at the end.

> ℹ Middlewares officially developed by or reviwed by Azure Functions Middlewares maintainers are always under the `@azure-functions-middlewares` scope in NPM registry.

<p align="right"><a href="#Table-of-contents">↟ Back to top</a></p>

---

## Help

<!-- ### FAQ

<details>
  <summary><b>1. First question?</b></summary>

Answer here

</details> -->

### Support

![](https://img.shields.io/github/issues/ggondim/azure-functions-middlewares)

If you need help or have a problem with this project, [start an issue](https://github.com/ggondim/azure-functions-middlewares/issues).

> We will not provide a SLA to your issue, so, don't expect it to be answered in a short time.

<br/>

<p align="right"><a href="#Table-of-contents">↟ Back to top</a></p>

---

## API

### `AzureFunctionCascade` _class_

#### Properties

<details>
  <summary>
    <b>
      <code>preProcessingPipeline</code> 
      <i>AsyncFunctionGenerator[]</i>
    </b>
  </summary>

> Returns all the middlewares added to the 'PRE_PROCESSING' phase.

</details>

<details>
  <summary>
    <b>
      <code>mainProcessingPipeline</code> 
      <i>AsyncFunctionGenerator[]</i>
    </b>
  </summary>

> Returns all the middlewares added to the 'MAIN' phase.

</details>

<details>
  <summary>
    <b>
      <code>postProcessingPipeline</code> 
      <i>AsyncFunctionGenerator[]</i>
    </b>
  </summary>

> Returns all the middlewares added to the 'POST_PROCESSING' phase.

</details>

#### Methods

<details>
  <summary>
    <b>
      <code>use()</code> 
    </b>
  </summary>

<i>function(asyncMiddleware, phase?):AzureFunctionCascade</i>

> Adds a middleware to the middleware cascade.

**Arguments**

| Argument | Type | Required | Default | Description |
| - | - | - | - | - |
| asyncMiddleware | `AsyncFunctionGenerator` | true | | An asynchronous function that takes two arguments `(context, STOP_SIGNAL)` |
| phase | `'PRE_PROCESSING' | 'MAIN' | 'POST_PROCESSING'` | false | `'MAIN'` | The cascade middlware phase that the middleware will be executed. |

**Returns**

`AzureFunctionCascade` the current instance of AzureFunctionCascade.

**Callbacks**

##### asyncMiddleware
_async function (context, STOP_SIGNAL?):any_

| Argument | Type | Required | Default | Description |
| - | - | - | - | - |
| context | [`Context` ℹ](https://github.com/Azure/azure-functions-nodejs-worker/blob/master/types/public/Interfaces.d.ts#L18) | true | | The Azure Function context object. |
| STOP_SIGNAL | `'!STOP!'` | false | `undefined` | | The constant value of a stop signal to return if you want to stop the middleware execution. |

Returns: anything returned by the middleware will be thrown as an error, except the `STOP_SIGNAL` constant.

</details>

<details>
  <summary>
    <b>
      <code>useIf()</code> 
    </b>
  </summary>

<i>function(expression, asyncMiddleware, phase?):AzureFunctionCascade</i>

> Adds a conditional middleware to the middleware cascade.

**Arguments**

| Argument | Type | Required | Default | Description |
| - | - | - | - | - |
| expression | `function` | true | | A function that takes a single argument `(context)` to check whether the middleware should be executed or not. |
| asyncMiddleware | `AsyncFunctionGenerator` | true | | Same as in `use()` method. |
| phase | `'PRE_PROCESSING' | 'MAIN' | 'POST_PROCESSING'` | false | `'MAIN'` | Same as in `use()` method. |

**Returns**

`AzureFunctionCascade` the current instance of AzureFunctionCascade.

**Callbacks**

##### expression
_function (context):boolean_

| Argument | Type | Required | Default | Description |
| - | - | - | - | - |
| context | [`Context` ℹ](https://github.com/Azure/azure-functions-nodejs-worker/blob/master/types/public/Interfaces.d.ts#L18) | true | | The Azure Function context object. |

Returns: the expression must always return a boolean indicating if the middleware should be executed (`true`) or not (`false`).

##### asyncMiddleware
Same as in `use()` method.

</details>

<details>
  <summary>
    <b>
      <code>catch()</code> 
    </b>
  </summary>

<i>function(catchCallback):AzureFunctionCascade</i>

> Registers an [error callback to be called](#Capturing-errors) when a middleware throws an error.

**Arguments**

| Argument | Type | Required | Default | Description |
| - | - | - | - | - |
| catchCallback | `function` | true | | A callback function that takes one argument `(context)` |

**Returns**

`AzureFunctionCascade` the current instance of AzureFunctionCascade.

**Callbacks**

##### catchCallback
_async function (context, STOP_SIGNAL?):any_

| Argument | Type | Required | Default | Description |
| - | - | - | - | - |
| context | [`Context` ℹ](https://github.com/Azure/azure-functions-nodejs-worker/blob/master/types/public/Interfaces.d.ts#L18) | true | | The Azure Function context object. |

Returns: anything returned by the callback will be ignored.

</details>

<details>
  <summary>
    <b>
      <code>listen()</code> 
    </b>
  </summary>

<i>function():AzureFunction</i>

> Returns the Azure Functions entrypoint `async (context) => {}` that will be triggered by the function HTTP trigger and will execute the entire middleware cascade.

**Returns**

`AzureFunction`: the [Azure Functions entrypoint](https://github.com/Azure/azure-functions-nodejs-worker/blob/master/types/public/Interfaces.d.ts#L12).

</details>


<p align="right"><a href="#Table-of-contents">↟ Back to top</a></p>

---

## Tecnhical concepts

> Azure Functions Middlewares was inspired from famous middleware cascades for Node.js, like Express, Koa and HAPI.

Our goal is to provide easy functions shareability and reusing to the entire Azure Functions ecosystem and community.

We knew some similar solutions at the time of our development, but they lack some crucial features, like `async` support, middleware stop signal and execution phases.

The design of `AzureFunctionCascade` class inside the project's core is really simple. It is almost just three arrays of pipeline phases that are iterated when the function entrypoint is called by the Functions Host.

### Features

* Async middleware support
* Error event middleware (a.k.a. "catch middleware")
* Execution order customization (pre-execution, main execution and post-execution phases)
* Middleware execution prevention (a.k.a. "stop signal")
* Conditional middlewares

### Related projects

* [azure-monofunction](https://github.com/ggondim/azure-monofunction): A router solution to Azure Functions using a single function and Azure Functions Middlewares.

### Similar projects

* [azure-middleware](https://www.npmjs.com/package/azure-middleware)
* [azure-func-middleware](https://www.npmjs.com/package/azure-func-middleware)

<br/>

<p align="right"><a href="#Table-of-contents">↟ Back to top</a></p>

---

## Contributing

### If you don't want to code

Help us spreading the word or consider making a donation.

#### ⭐ Star the project

![](https://img.shields.io/github/stars/ggondim/azure-functions-middlewares?style=social)

#### 🐤 Tweet it

![](https://img.shields.io/twitter/url?style=social&url=https%3A%2F%2Fgithub.com%2Fggondim%2Fazure-functions-middlewares)


#### 🙋‍♂️ Add your company to the [used by](#Used-in-production-by-companies) section

Make a pull request or start an issue to add your company's name.

<!-- #### Donate

![](https://c5.patreon.com/external/logo/become_a_patron_button.png)

![](https://camo.githubusercontent.com/b8efed595794b7c415163a48f4e4a07771b20abe/68747470733a2f2f7777772e6275796d6561636f666665652e636f6d2f6173736574732f696d672f637573746f6d5f696d616765732f707572706c655f696d672e706e67)

<img src="https://opencollective.com/webpack/donate/button@2x.png?color=blue" width=250 /> -->

### If you want to code

![](https://img.shields.io/static/v1?label=code%20style&message=eslint/airbnb&color=orange) 

#### Code of conduct

![](https://img.shields.io/static/v1?label=Code%20of%20conduct&message=Contributor%20Covenant&color=informational)

We follow [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/0/code_of_conduct/code_of_conduct.md). If you want to contribute to this project, you must accept and follow it.

#### SemVer

![](https://img.shields.io/static/v1?label=semver&message=2.0.0&color=informational)

This project adheres to [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

#### Roadmap

If you are not solving an issue or fixing a bug, you can help developing the roadmap below.

<details>
  <summary>
    <b>See the roadmap</b>
  </summary>

* [ ] Improve docs/FAQ
* [ ] Support async functions also on conditional evaluators and catch callback
* [ ] Create a "priority" score to manually sort middlewares 

</details>


<br/>

<p align="right"><a href="#Table-of-contents">↟ Back to top</a></p>

---

## Hall of fame


### Used in production by companies

* [NOALVO](https://midianoalvo.com.br)


<!-- ### Contributors

[![](https://sourcerer.io/fame/$USER/$OWNER/$REPO/images/0)](https://sourcerer.io/fame/$USER/$OWNER/$REPO/links/0)

### Backers

<object type="image/svg+xml" data="https://opencollective.com/collective/tiers/backers.svg?avatarHeight=36&width=600"></object>

### Sponsors

<object type="image/svg+xml" data="https://opencollective.com/collective/tiers/Sponsors.svg?avatarHeight=36&width=600"></object> -->


<p align="right"><a href="#Table-of-contents">↟ Back to top</a></p>

---

## License

![](https://img.shields.io/github/license/ggondim/azure-functions-middlewares)

Licensed under the [MIT License](LICENSE.md).

<br/>

<p align="right"><a href="#Table-of-contents">↟ Back to top</a></p>

---
