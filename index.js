const { sep, resolve, join } = require('path');

const Enmap = require('enmap');
const users = new Enmap({ name: 'users'});

const bcrypt = require('bcrypt');

const Koa = require('koa');
const render = require('koa-ejs');
const parser = require('koa-bodyparser');
const session = require('koa-session');
const Router = require('koa-router');

const router = new Router();
const app = new Koa();

const dataDir = resolve(`${process.cwd()}${sep}`);


const newUser = (username, name, plainpw, admin = false) => {
    if (users.has(username)) throw Error(`User ${username} already exists!`);
    bcrypt.hash(plainpw, 10, (err, password) => {
        if (err) throw err;
        users.set(username, {
            username, name, password, admin, created: Date.now()
        });
    });
};

const login = (username, password) => {
    const user = users.get(username);
    if (!user) return new Promise(resp => resp(false));
    if (!password) return new Promise(resp => resp(false));
    return bcrypt.compare(password, user.password);
};

app.keys = ['secret'];
app.use(session(app));

render(app, {
    root: join(__dirname, 'views'),
    layout: 'template',
    viewExt: 'html',
    cache: false,
    debug: true
});

router.get('/', async (ctx, next) => {
    if (ctx.session.username) {
        await ctx.render('index', {
            user: users.get(ctx.session.username)
        })
    } else {
        await ctx.render('index')
    }
});

router.get('/login', async (ctx) => {
    await ctx.render('login');
});

router.post('/login', async (ctx) => {
    if (!ctx.request.body.username || !ctx.request.body.password) {
        ctx.throw(400, 'Missing Username or Password');
    }

    const success = await login(ctx.request.body.username, ctx.request.body.password);
    if (success) {
        const user = users.get(ctx.request.body.username);

        ctx.session.logged = true;
        ctx.session.username = ctx.request.body.username;
        ctx.session.admin = user.admin;
        ctx.session.name = user.name;

        ctx.session.save();

        console.log(`User authenticated: ${user.username}`);

        ctx.redirect('/secret');
    } else {
        console.log('Authentication Failed!');

        ctx.throw(403, 'Nope. Not allowed, mate.');
    }
});


router.get('/register', async (ctx) => {
    await ctx.render('register');
});

router.post('/register', async (ctx) => {
    if (!ctx.request.body.username || !ctx.request.body.password || !ctx.request.body.name) {
        ctx.throw(400, 'Missing Username, Password, or Name');
    }

    const success = await newUser(ctx.request.body.username, ctx.request.body.name, ctx.request.body.password)
    if (success) {
        const user = users.get(ctx.request.body.username)

        ctx.session.logged = true;
        ctx.session.username = ctx.request.body.username;
        ctx.session.admin = user.admin;
        ctx.session.name = user.name;
    
    
        ctx.session.save();
    
        console.log(`User Registered: ${user.username}`);
    
        ctx.redirect('/secret');
    } else {
        console.log('Register Failed!')

        ctx.throw(403, 'Nope. Not allowed, mate.');
    }
});

router.get('/logout', async (ctx) => {
    ctx.session = null;
    ctx.redirect('/');
});

router.get('/secret', async (ctx) => {
    if (!ctx.session.logged) ctx.throw(403, 'Unauthorized to view this page');
    await ctx.render('secret');
});


app.use(parser())
app.use(router.routes())
app.use(router.allowedMethods());

app.on('error', (err, ctx) => {
    console.error('server error', err, ctx)
});


app.listen(81, function() {
    console.log('Loaded!')
})