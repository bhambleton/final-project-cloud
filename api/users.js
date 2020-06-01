const router = require('express').Router();

// Login User
router.post('/login', function (req, res, next) {
    res.status(200).send({
        valid: "Valid"
    })

});


// Creating  a new User
router.post('/', function (req, res,next){
    res.status(200).send({
        valid: "Valid"
    })

});

// Login User
router.get('/:id', function (req, res, next) {
    res.status(200).send({
        valid: "Valid"
    })

});

module.exports = router;