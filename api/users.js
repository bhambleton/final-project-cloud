const router = require('express').Router();

const { validateAgainstSchema } = require('../lib/validation');
const { generateAuthToken, requireAuthentication, checkAuthentication } = require('../lib/auth');

const {
  UserSchema,
  insertNewUser,
  getUserByEmail,
  getUserInfoById,
  validateUser
} = require('../models/user');


// Login User
router.post('/login', async (req, res) => {
  if (req.body && req.body.email && req.body.password) {
    try {
      //validate user using email and password
      const user = await validateUser(
        req.body.email, req.body.password
      );

      if (user) {
        const token = generateAuthToken(user.id, user.role);
        res.status(200).send({
          token: token
        });
      } else {
        res.status(401).send({
          error: "Invalid login credentials."
        });
      }
    } catch (err) {
      console.error(" == error:", err);
      res.status(500).send({
        error: "Error logging in. Try again later."
      });
    }
  } else {
    res.status(400).send({
      error: "Request body requires a user email and password."
    });
  }
});


// Creating  a new User
router.post('/', checkAuthentication, async (req, res,next) => {
  if (validateAgainstSchema(req.body, UserSchema)) {
    try {
      if ((req.body.role === 'admin' || req.body.role === 'instructor') && req.role !== 'admin') {
        res.status(401).send({
          error: "User not authorized to create a user with those privileges."
        });
      } else {
        const id = await insertNewUser(req.body);
        res.status(201).send({
          userId: id
        });
      }
    } catch (err) {
      console.error(" == Error:", err);
      res.status(500).send({
        error: "Error creating new user. Try again later."
      });
    }
  } else {
      res.status(400).send({
        error: "Request body does not contain correct fields."
      });
  }

});

// Login User
router.get('/:id', requireAuthentication, async (req, res, next) => {
    if (req.user == req.params.id) {
      try {
        const user = await getUserInfoById(req.params.id);

        if (user) {
          res.status(200).send(user);
        } else {
          next();
        }
      } catch (err) {
        console.error(" == error:", err);
        res.status(500).send({
          error: "Error fetching user info. Try again later."
        });
      }
    } else {
      res.status(403).send({
        error: "Unauthorized to access specified resource."
      });
    }
});

module.exports = router;
