// server.js
// ---------------------------------------------------------------------------
// Startpunkt för appen. Sätter upp Express, sessioner, vyer och rutter.
// ---------------------------------------------------------------------------
const path = require('path');
const express = require('express');
const session = require('express-session');

const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const profileRoutes = require('./routes/profile');

const app = express();
const PORT = process.env.PORT || 3000;

// Vyer (EJS) och statiska filer.
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));

// Sessioner. secret bör ligga i miljövariabel i en riktig app;
// här räcker ett labbvärde. httpOnly skyddar cookien från JS-åtkomst.
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'labb-hemlighet-byt-mig',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 },
  })
);

// Gör inloggad användare tillgänglig i alla vyer (för menyn).
app.use((req, res, next) => {
  res.locals.currentUser = req.session.userId
    ? { id: req.session.userId, username: req.session.username, role: req.session.role }
    : null;
  next();
});

// Rutter.
app.get('/', (req, res) => res.redirect(req.session.userId ? '/dashboard' : '/login'));
app.use(authRoutes);
app.use(itemRoutes);
app.use(profileRoutes);

// 404.
app.use((req, res) => res.status(404).render('404'));

// Generisk felhanterare: läck ALDRIG stacktrace till användaren i prod.
// (Sårbara versionen gör tvärtom, med flit, för att visa information leakage.)
app.use((err, req, res, next) => {
  console.error(err); // loggas serverside
  res.status(500).render('500');
});

app.listen(PORT, () => {
  console.log(`\n  Säkerhetslabb kör på  http://localhost:${PORT}`);
  console.log('  Testkonton:  alice / alice123   ·   bob / bob123   ·   admin / Admin!2026\n');
});
