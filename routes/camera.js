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
  // filter - using the JSON from goog-refine.
  // foramt 
  // save to mongo
}) 

reader.addListener('end', function(){
  console.log('thats it, yay!');
  //maybe save to flat file, database, whatever.
})


var CAMERAS = []
function getCameras(callback){
  if(CAMERAS.length) return  callback(CAMERAS);
  db.cameras.find({}, {}, function(err, cameras) { 
      CAMERAS = cameras; 
      callback(CAMERAS)
  }); 
}


function getPhotoset(camera, lens){
  // lens is optional
  var find = {camera:camera}
  if(lens) find.lens = lens;
  db.photos.find(find).limit(50, funciton(err, docs){
    cb(docs);
  })
  // return 50 photos, ordere by DESH 

}



function getPhotoStats(camera, lens){

  // specs: http://www.chartjs.org/docs/
  var data = {
    labels: ["January", "February", "March", "April", "May", "June", "July"],
    datasets: [
        {
            label: "My First dataset",
            fillColor: "rgba(220,220,220,0.5)",
            strokeColor: "rgba(220,220,220,0.8)",
            highlightFill: "rgba(220,220,220,0.75)",
            highlightStroke: "rgba(220,220,220,1)",
            data: [65, 59, 80, 81, 56, 55, 40]
        },
        {
            label: "My Second dataset",
            fillColor: "rgba(151,187,205,0.5)",
            strokeColor: "rgba(151,187,205,0.8)",
            highlightFill: "rgba(151,187,205,0.75)",
            highlightStroke: "rgba(151,187,205,1)",
            data: [28, 48, 40, 19, 86, 27, 90]
        }
    ]
};

return data
}


// camera details
router.get('/camera/:name', function(req, res) {
  console.log('Showing camera: '+req.params.name)
  getCameras(function(cameras){
   db.cameras.findOne({name: req.params.name}, function(err, cam) {
      // docs is an array of all the documents in mycollection
      res.render('camera', { cameras:  cameras, cam: cam, photoset, photo_by_months:photo_by_months });
   }); 
 });
});






module.exports = router;