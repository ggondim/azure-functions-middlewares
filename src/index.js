class AzureFunctionCascade {
  constructor(pipeline) {
    this.pipeline = pipeline || [];
    this.catchFunction = (error, context) => {
      context.log(`Error: ${error}`);
      context.res = { status: 500 };
    };
  }

  use(func) {
    if (func.constructor.name && func.constructor.name === 'AsyncFunction') {
      this.pipeline.push({ async: true, func: func });
      return this;
    }
    this.pipeline.push({ async: false, func });
    return this;
  }

  useAsync(asyncFunc) {
    this.pipeline.push({ async: true, func: asyncFunc });
    return this;
  }

  catch(catchFunction) {
    this.catchFunction = catchFunction;
    return this;
  }

  listen() {
    return async (context) => {
      let error;
      for (let i = 0; i < this.pipeline.length; i++) {
        const middleware = this.pipeline[i];
        let result;
        if (middleware.async) {
          result = await middleware.func(context);
        } else {
          result = await execFuncNextAsync(middleware.func, context);
        }
        if (result) {
          error = result;
          break;
        }
      }
      if (error) {
        this.catchFunction(error, context);
      }
    };
  }
}

function execFuncNextAsync(func, context) {
  return new Promise((resolve, reject) => {
    const next = (val) => resolve(val);
    try {
      func(context, next);
    } catch (e) {
      reject(e);
    }              
  });
}

module.exports = AzureFunctionCascade;
