const Koa = require('koa');
const app = new Koa();

app.use(require('koa-static')('public'));
app.use(require('koa-bodyparser')());

const Router = require('koa-router');
const router = new Router();

let clients = [];

router.get('/subscribe', async (ctx, next) => {
    const promise = new Promise((resolve, reject) => {
        clients.push(resolve);

        ctx.res.on('close', () => {
            clients.splice(clients.indexOf(resolve), 1);
            const error = new Error('Connection close');
            error.code = 'ECONNRESET';
            reject(error);
        });
    });

    let message;
    try {
        message= await promise;
    } catch(err) {
        if (err.code === 'ECONNRESET') return;
        throw err;
    }

    ctx.body = message;
});

router.post('/publish', async (ctx, next) => {
    const message = ctx.request.body.message;

    if (!message) ctx.throw(400);

    clients.forEach(client => {
        client(message);
    });

    ctx.body = 'ok';
});

app.use(router.routes());

module.exports = app;
