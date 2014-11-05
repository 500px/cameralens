var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');

var csv = require('ya-csv');

// DB setup

var db_url = process.env.MONGOHQ_URL || 'mongodb://localhost:27020/cameralens'; 
var db = mongojs(db_url, ['photos', 'cameras', 'lenses',]);

db.cameras.save({ name: 'hehe' }, function(err, success){
  console.log('yaya!')
});


db.cameras.ensureIndex( ['name', 'mount'] )




router.get('/', function(req, res) {
  // find everything
  db.cameras.find(function(err, cameras) {
      // docs is an array of all the documents in mycollection
      res.render('home', { cameras: cameras || []  });
  });
  
});



// parse CSV  -- madness

var reader = csv.createCsvFileReader('data/test.csv', {columnsFromHeader:true, 'separator': ','});
//var writer = new csv.CsvWriter(process.stdout);
reader.addListener('data', function(data){
  //do something with data
  console.log('CRUNCHING: ',data);
  // filter
  // foramt 
  // save to mongo
}) 

reader.addListener('end', function(){
  console.log('thats it, yay!');
  //maybe save to flat file, database, whatever.
})



// camera details
router.get('/camera/:name', function(req, res) {
  console.log('Showing camera: '+req.params.name)
  db.cameras.findOne({name: req.params.name}, function(err, cam) {
      // docs is an array of all the documents in mycollection
      res.render('camera', { cameras: cameras || {} });
  }); 
});






module.exports = router;