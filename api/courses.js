const router = require('express').Router();

router.post('/', function (req, res, next) {
    res.status(200).send({
        valid: "Valid"
    })

});


module.exports = router;