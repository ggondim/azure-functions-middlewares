const AzureFunctionsMiddlewareCascade = require('./src/index');

const app = new AzureFunctionsMiddlewareCascade()
  .use((context, next) => {
    try {
      context.res = { a: 'b' };
      context.log('um');
      next();
    } catch (e) {
      next(e);
    }
  })
  .use(async (context) => {
    try {
      const funcPromise = () => {
        return new Promise((resolve, reject) => {
          setTimeout(resolve, 1000);
        });
      };
      await funcPromise();      
      context.log(context.res);
    } catch (e) {
      return e;
    }
  })
  .useAsync(async (context) => {
    try {
      const funcPromise = () => {
        return new Promise((resolve, reject) => {
          setTimeout(resolve, 1000);
        });
      };
      await funcPromise();      
      context.log('três');
      throw "teste";
    } catch (e) {
      return e;
    }
  })
  // .catch((error, context) => {
  //   context.log("Erro: " + error);
  // });

console.log(app);
app.listen()({ log: console.log });
