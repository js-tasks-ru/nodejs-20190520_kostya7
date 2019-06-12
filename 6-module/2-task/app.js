const Koa = require('koa');
const Router = require('koa-router');
const User = require('./models/User');
const mongoose = require('mongoose');

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
      ctx.body = {error: err.message};
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

function validateId(ctx, next) {
    const id = ctx.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        ctx.throw(400);
    }

    return next();
}

// async function handleMongooseValidationError(ctx, next) {
//     try {
//         await next();
//     } catch(e) {
//         if (e.name !== 'ValidationError') throw e;
//
//         ctx.status = 400;
//         const errors = {};
//
//         for (const field in e.errors) {
//             errors[field] = e.errors[field].message;
//         }
//
//         ctx.body = {
//             errors: errors
//         };
//     }
// }

router.get('/users', async (ctx) => {
  ctx.body = await User.find({});
});

router.get('/users/:id', validateId, async (ctx) => {
  const id = ctx.params.id;
  const user = await User.findById(id);
      if (!user) {
          ctx.throw(404);
      }

      ctx.body = user;
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

// router.patch('/users/:id', validateId, handleValidationErrors, async (ctx) => {
//     const fields = _.pick(ctx.request.body, ['displayName', 'email']);
//
//     const user = await User.findByIdAndUpdate(ctx.params.id, fields, {
//         runValidators: true,
//         new: true,
//     });
//
//     ctx.body = user;
// });

// router.post('/users', handleMongooseValidationError, async (ctx) => {
//     const fields = _.pick(ctx.request.body, ['displayName', 'email']);
//     ctx.body = await User.create(fields);
// });

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

router.delete('/users/:id', validateId, async (ctx) => {
  const id = ctx.params.id;

  const user = await User.findByIdAndDelete(id);
    if (!user) {
      ctx.throw(404);
    }

    ctx.body = user;
});

app.use(router.routes());

module.exports = app;
