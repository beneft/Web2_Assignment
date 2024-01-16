const express = require('express');
const session = require('express-session');
const pg = require('pg');
const config = require('./config');
const bcrypt = require('bcrypt');
const path = require('path');
const ejs = require('ejs');

const app = express();
const port = config.server.port;

// Use session to track user login status
app.use(session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: true,
}));

// PostgreSQL configuration
const pool = new pg.Pool({
    user: config.database.user,
    host: config.database.host,
    database: config.database.database,
    password: config.database.password,
    port: config.database.port
});

// Serve static files from the public directory
app.use(express.static('public'));

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public'));

//Routes
app.get('/', (req, res) => {
    res.render('main', { currentUser: req.session.user });
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    // Authenticate user
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM data WHERE username = $1', [username]);

        if (result.rows.length === 1) {
            const hashedPassword = result.rows[0].password;

            // Compare the hashed password with the provided password
            const passwordMatch = await bcrypt.compare(password, hashedPassword);

            if (passwordMatch) {
                // Successful login
                req.session.user = username;
                res.redirect('/');
            } else {
                message='Incorrect password or username';
                res.status(401).render('mistake',{message:message});
            }
        } else {
            message='Incorrect password or username';
            res.status(401).render('mistake',{message:message});
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    } finally {
        client.release();
    }
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, config.bcrypt.saltRounds);
    const client = await pool.connect();
    try {
        await client.query('INSERT INTO data (username, password) VALUES ($1, $2)', [username, hashedPassword]);
        req.session.user = username; // Log in the user after registration
        res.redirect('/');
    } catch (error) {
        // Handle registration error
        if (error.code === '23505') {
            message='User with such username already exsits';
            return res.status(400).render('mistake',{message:message});
        }
        res.status(500).send('Error registering user');
    } finally {
        client.release();
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
        } else {
            res.redirect('/');
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});