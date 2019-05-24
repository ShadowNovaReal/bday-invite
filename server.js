const express = require('express');
const app = express();

const Enmap = require('enmap');
const users = new Enmap({ name: "users" });

const bodyParser = require('body-parser');
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.set('view engine', 'ejs');

app.use(express.static(`${__dirname}/public`));


app.get('/', (req, res) => {
    res.render(`${__dirname}/public`);
});

app.get('/callback', (req, res) => {
    res.redirect('/');
});

app.get('/information', (req, res) => {

    res.render(`${__dirname}/public/info/information.ejs`);
});

app.get('/information/about-me', (req, res) => {
    res.render(`${__dirname}/public/info/about-me.ejs`);
});

app.get('/print', (req, res) => {
    res.render(`${__dirname}/public/info/print.ejs`);
});

app.get('/invite', (req, res) => {
    res.render(`${__dirname}/public/info/invite.ejs`, {
        users: users
    });
});

app.get('/set', (req, res) => {
    res.render(`${__dirname}/public/set.ejs`, {
        users: users
    });
});

app.post('/set', (req, res) => {
    console.log(req.body);
    if (!req.body.key) res.redirect('/set-error');

    users.set(req.body.key, req.body.name, 'name');
    users.set(req.body.key, req.body.age, 'age');

    console.log(users.get(req.body.key));
    res.redirect('/set');
});

app.get('/set-error', (req, res) => {
    res.render(`${__dirname}/public/set-error`);
});

app.listen(82);