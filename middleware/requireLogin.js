// middleware/requireLogin.js
// Protects routes that require a login. If there is no user in the session,
// the visitor is sent to the login page. Simple but central building block
// for access control.
module.exports = function requireLogin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.redirect('/login');
  }
  next();
};
