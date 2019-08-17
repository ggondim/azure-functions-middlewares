module.exports = [
  {
    func: async (context) => {
      context.res.body = { message: 'First execution '};
      console.log(context.res.body);
    },
    phase: 'PRE_PROCESSING'
  },
  {
    func: async (context) => {
      context.res.body = { message: 'Second execution '};
      console.log(context.res.body);
    },
    phase: 'PRE_PROCESSING',
    expression: () => { return false }
  },
  {
    func: async (context) => {
      context.res.body = { message: 'REAL Fourth execution '};
      console.log(context.res.body);
    },
    phase: 'POST_PROCESSING'
  },
  {
    func: async (context) => {
      context.res.body = { message: 'Fourth execution '};
      console.log(context.res.body);
    },
    expression: (context) => {
      return context.res.body.message === 'Fourth execution';
    }
  },
  {
    func: async (context) => {
      context.res.body = { message: 'Third execution '};
      console.log(context.res.body);
    }
  },
];