// middleware/requireLogin.js
// Skyddar rutter som kräver inloggning. Finns ingen användare i sessionen
// skickas besökaren till login. Enkel men central byggsten för access-kontroll.
module.exports = function requireLogin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.redirect('/login');
  }
  next();
};
