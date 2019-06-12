const Koa = require('koa');
const Router = require('koa-router');
const User = require('./models/User');

const app = new Koa();

app.use(require('koa-static')('public'));
app.use(require('koa-bodyparser')());

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
      // Не смог иначе отловить ошибку эту, потому костыль )
    if (err.status === 400 && err.message === 'Такой email уже существует') {
      ctx.status = 400;
      ctx.body = { errors: {email: 'Такой email уже существует'}};
    }
    else if (err.status) {
      ctx.status = err.status;
      ctx.body = {errors: err.message};
    } else {
      ctx.status = 500;
      ctx.body = {error: 'Internal server error'};
    }
  }
});

const router = new Router();

const checkMailValidate = async (ctx, next) => {
  await User.find({email: ctx.request.body.email})
      .then((res) => {
        if (res.length) ctx.throw(400, 'Такой email уже существует');
      });
  await next();
};

router.get('/users', async (ctx) => {
  ctx.body = await User.find({}).then((users) => users);
});

router.get('/users/:id', async (ctx) => {
  const id = ctx.params.id;
  ctx.body = await User.findById(id)
      .then((res) => {
    if (res === null) ctx.throw(404);

    return res;
  })
      .catch((e) => {
        e.name === 'NotFoundError' ? ctx.throw(404) : ctx.throw(400);
      });
});

router.patch('/users/:id', checkMailValidate, async (ctx) => {
  const id = ctx.params.id;
  const updateBody = {
    email: ctx.request.body.email,
    displayName: ctx.request.body.displayName,
  };

  ctx.body = await User.findOneAndUpdate(id, updateBody, { runValidators: true }, (err, user) => user)
      .catch((e) => {
        const errors = Object.keys(e.errors).map((key) => {
          return ({errors: {[key]: e.errors[key].message}});
        });
        ctx.status = 400;
        // Здесь, очевидно, тоже костыль, т.к. обращается к конкретному индексу
        return errors[1];
      });
});

router.post('/users', async (ctx) => {
  const body = ctx.request.body;
  const user = new User({
    email: body.email,
    displayName: body.displayName,
  });

  ctx.body = await user.save()
      .catch((e) => {
        const errors = Object.keys(e.errors).map((key) => ({errors: {email: e.errors[key].message}}));
        ctx.status = 400;
        return errors[0];
      });
});

router.delete('/users/:id', async (ctx) => {
  const id = ctx.params.id;

  ctx.body = await User.findByIdAndDelete(id).then(result => {
    if (result === null) {
      ctx.throw(404);
    }
    return result;
  });
});

app.use(router.routes());

module.exports = app;
