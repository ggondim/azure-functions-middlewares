const AzureFunctionsMiddlewareCascade = require('./src/index');

module.exports = new AzureFunctionsMiddlewareCascade()
  .use((context, next) => {
    try {
      somethingWith(context);
    } catch (e) {
      next(e);
    }
  })
  .use(async (context) => {
    try {
      somethingWith(context);
    } catch (e) {
      return e;
    }
  })
  .useAsync(async (context) => {
    try {
      somethingWith(context);
    } catch (e) {
      return e;
    }
  })
  .catch((error, context) => {
    context.log(error);
  })
  .listen();

const app = new AzureFunctionsMiddlewareCascade();

app.use();
