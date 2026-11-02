// server.js
// ---------------------------------------------------------------------------
// Application entry point. Sets up Express, sessions, views and routes.
// ---------------------------------------------------------------------------
const path = require('path');
const express = require('express');
const session = require('express-session');

const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const profileRoutes = require('./routes/profile');

const app = express();
const PORT = process.env.PORT || 3000;

// Views (EJS) and static files.
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));

// Sessions. In a real app the secret belongs in an environment variable;
// a lab value is fine here. httpOnly keeps the cookie out of reach of JS.
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'lab-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 },
  })
);

// Make the logged-in user available to every view (for the nav bar).
app.use((req, res, next) => {
  res.locals.currentUser = req.session.userId
    ? { id: req.session.userId, username: req.session.username, role: req.session.role }
    : null;
  next();
});

// Routes.
app.get('/', (req, res) => res.redirect(req.session.userId ? '/dashboard' : '/login'));
app.use(authRoutes);
app.use(itemRoutes);
app.use(profileRoutes);

// 404.
app.use((req, res) => res.status(404).render('404'));

// Generic error handler: NEVER leak a stack trace to the user in production.
// (A later lesson, A05, intentionally does the opposite to show info leakage.)
app.use((err, req, res, next) => {
  console.error(err); // logged server-side
  res.status(500).render('500');
});

app.listen(PORT, () => {
  console.log(`\n  Security lab running at  http://localhost:${PORT}`);
  console.log('  Test accounts:  alice / alice123   ·   bob / bob123   ·   admin / Admin!2026\n');
});
