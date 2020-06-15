const STOP_SIGNAL = '!STOP!';

const DEFAULT_CATCH = (error, context) => {
  context.log(`Error: ${error}`);
  context.res = { status: 500 };
};

const Phases = {
  PRE_PROCESSING: 'PRE_PROCESSING',
  MAIN: 'MAIN',
  POST_PROCESSING: 'POST_PROCESSING',
};

function validateFunction(argument, func, isAsync) {
  if (typeof func !== 'function') {
    throw `Argument ${argument} must be a function`;
  }
  if (isAsync && func.constructor.name && func.constructor.name !== 'AsyncFunction') {
    throw 'This module version now only supports Async functions as middlewares.';
  }
}

async function processPipeline(pipeline, context, catchFunction) {
  let error;
  let mustStop;

  for (let i = 0; i < pipeline.length; i++) {
    const middleware = pipeline[i];
    const shouldRun = middleware.expression(context);

    if (shouldRun) {
      let result;

      try {
        result = await middleware.func(context, STOP_SIGNAL);
      } catch (err) {
        error = err;
      }

      if (result) {
        mustStop = result == STOP_SIGNAL;
        error = result;
        break;
      }
    }
  }

  if (!mustStop && error) catchFunction(error, context);
  return { mustStop, error };
}

async function functionEntryPoint(context, cascade) {
  cascade.setResponseDefaults(context);

  const preProcessing = await processPipeline(
    cascade.preProcessingPipeline, context, cascade.catchFunction);
  if (preProcessing.mustStop || preProcessing.error) {
    return;
  }

  const mainProcessing = await processPipeline(
    cascade.mainProcessingPipeline, context, cascade.catchFunction);
  if (mainProcessing.mustStop || mainProcessing.error) {
    return;
  }

  await processPipeline(cascade.postProcessingPipeline, context, cascade.catchFunction);
}

class AzureFunctionCascade {
  constructor(pipeline = []) {
    this.pipeline = pipeline;
    this.catchFunction = DEFAULT_CATCH;
    this.Phases = Phases;
  }

  static async $runManualEntryPoint(context, cascade) {
    return functionEntryPoint(context, cascade);
  };

  get preProcessingPipeline() {
    return this.pipeline.filter(p => p.phase === Phases.PRE_PROCESSING);
  }
  get mainProcessingPipeline() {
    return this.pipeline.filter(p => p.phase === Phases.MAIN);
  }
  get postProcessingPipeline() {
    return this.pipeline.filter(p => p.phase === Phases.POST_PROCESSING);
  }

  /**
   * @protected
   * (Internal use only) Function to manually add a middleware to current cascade.
   */
  pushMiddleware(asyncFunc, phase, expression) {
    validateFunction('asyncFunc', asyncFunc, true);
    validateFunction('expression', expression);
    this.pipeline.push({
      expression,
      func: asyncFunc,
      phase,
    });
  }

  /**
   * Adds a middleware to current middleware cascade.
   * @param {AsyncFunction} asyncFunc Function to be executed as middleware
   * @param {String?} phase Cascade phase to execute the middleware. If not specified, it will be executed at main processing phase.
   */
  use(asyncFunc, phase = Phases.MAIN) {
    this.pushMiddleware(asyncFunc, phase, () => true);
    return this;
  }

  /**
   * Adds a conditional middleware to current middleware cascade.
   * @param {Fucntion} expression Function to check if the middleware should execute or not.
   * @param {AsyncFunction} asyncFunc Async Function to be executed as middleware
   * @param {String?} phase Cascade phase to execute the middleware. If not specified, it will be executed at main processing phase.
   */
  useIf(expression, asyncFunc, phase = Phases.MAIN) {
    this.pushMiddleware(asyncFunc, phase, expression)
    return this;
  }

  /**
   * Sets a function to be called when an error is thrown in any middleware.
   * @param {Function} catchFunction Function to be called when an error is thrown in any middleware.
   */
  catch(catchFunction) {
    this.catchFunction = catchFunction;
    return this;
  }

  /**
   * @protected
   * (Internal use only) Function to set context response defaults.
   */
  setResponseDefaults(context) {
    if (!context.res) context.res = {};
    if (!context.res.headers) context.res.headers = {};
  }

  /**
   * Returns the Azure Function entry point and process the full pipeline.
   */
  listen() {
    return async (context) => {
      return await functionEntryPoint(context, this);
    };
  }
}

module.exports = AzureFunctionCascade;
