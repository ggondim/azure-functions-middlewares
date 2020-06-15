const assert = require('assert');
const AzureMiddlewareCascade = require('../src/index');
const fullPipeline = require('./index.mocks');

describe('AzureMiddlewareCascade', () => {

  it('test getters', () => {
    const cascade = new AzureMiddlewareCascade();
    cascade
      .use(async () => {})
      .use(async () => {})
      .use(async () => {})
      .use(async () => {}, cascade.Phases.POST_PROCESSING)
      .use(async () => {}, cascade.Phases.POST_PROCESSING)
      .use(async () => {}, cascade.Phases.POST_PROCESSING)
      .use(async () => {}, cascade.Phases.PRE_PROCESSING)
      .use(async () => {}, cascade.Phases.PRE_PROCESSING);
    assert.equal(3, cascade.mainProcessingPipeline.length);
    assert.equal(3, cascade.postProcessingPipeline.length);
    assert.equal(2, cascade.preProcessingPipeline.length);
    assert.equal(cascade.pipeline.reduce((a, c) => {
      return a && c.expression();
    }, true), true);
  });

  it('fails if a middleware is not an async function', () => {
    const cascade = new AzureMiddlewareCascade();
    try {
      cascade.use(() => {});
      throw 'Error not fired';
    } catch (error) {
      assert.equal(error, 'This module version now only supports Async functions as middlewares.');
    }
  });

  it('must validate a full pipeline', async () => {
    const cascade = new AzureMiddlewareCascade();

    // included as pre processing, should not execute
    cascade.useIf(fullPipeline[1].expression, fullPipeline[1].func, fullPipeline[1].phase);

    // included as main processing, should not execute
    cascade.useIf(fullPipeline[3].expression, fullPipeline[3].func, fullPipeline[3].phase);

    // included as pre processing, should execute first
    cascade.use(fullPipeline[0].func, fullPipeline[0].phase);

    // included as post processing, should execute last
    cascade.use(fullPipeline[2].func, fullPipeline[2].phase);

    // included as main processing, should execute second
    cascade.use(fullPipeline[4].func);

    try {
      // should log first, third and fourth execution
      const fn = await cascade.listen();
      await fn({});
      return Promise.resolve();
    } catch (error) {
      console.log(error);
      return Promise.reject(error);
    }
  })

});