const jwt = require('jsonwebtoken');

const expires = '24h';
const secretKey = process.env.SECRET_KEY;


exports.generateAuthToken = (userId, role) => {
  const payload = { sub: userId, role: role };

  return jwt.sign(payload, secretKey, { expiresIn: expires });
};


// Check for auth token, setting req.user and req.admin with appropriate values
// If token is not present or key is not correct, print error and send 401 status
exports.requireAuthentication = (req, res, next) => {
  const authHeader = req.get('Authorization') || '';

  if (authHeader) {
    const authHeaderParts = authHeader.split(' ');

    const token = authHeaderParts[0] === 'Bearer' ? authHeaderParts[1] : null;

    try {
      const payload = jwt.verify(token, secretKey);
      req.user = payload.sub;
      req.role = payload.role;
      next();
    } catch (err) {
      console.error(" == error:", err);
      res.status(401).send({
        error: "Invalid authentication token."
      });
    }
  } else {
    res.status(401).send({
      error: "Authentication token required."
    });
  }
};


// Used to check for admin privileges
// Check for auth token, setting req.user and req.admin with appropriate values
// If token is not present or it is not valid, continue to next route
exports.checkAuthentication = (req, res, next) => {
  const authHeader = req.get('Authorization') || '';

  if (authHeader) {
    const authHeaderParts = authHeader.split(' ');

    const token = authHeaderParts[0] === 'Bearer' ? authHeaderParts[1] : null;

    try {
      const payload = jwt.verify(token, secretKey);
      req.user = payload.sub;
      req.role = payload.role;
      next();
    } catch (err) {
      next();
    }
  } else {
    next();
  }
};
