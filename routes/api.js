var express = require('express');
var router = express.Router();
 
/* GET home page. */
router.get('/camera/:slug', function(req, res) {
	console.log(req);
  res.send(req.params);
});
  
module.exports = router;