var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');

var csv = require('ya-csv');

// DB setup

var db_url = process.env.MONGOHQ_URL || 'mongodb://localhost:27020/cameralens'; 
var db = mongojs(db_url, ['photos', 'cameras', 'lenses',]);

router.get('/', function(req, res) {
  // find everything
  db.cameras.find(function(err, cameras) {
      // docs is an array of all the documents in mycollection
      res.render('home', { cameras: cameras || []  });
  });
  
});


var CAMERAS = [];
function getCameras(callback){
  if(CAMERAS.length) return callback(CAMERAS);

  db.cameras.find({}, function(err, cameras) { 
      CAMERAS = cameras; 
      callback(CAMERAS)
  }); 
}


function getPhotoset(camera, lens, callback){
  // lens is optional
  var find = {camera: camera}
  if(lens) find.lens = lens;

  db.photos.find(find).limit(50, function(err, docs){
    callback(docs);
  });
  // return 50 photos, ordere by DESC 
}



/*
function getPhotoDetail(id, cb){
  api.getPhoto(cb)
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

*/

// camera details
router.get('/camera/:name', function(req, res) {
  console.log('Showing camera: '+req.params.name)
  
  getCameras(function(cameras){
   db.cameras.findOne({name: req.params.name}, function(err, cam) {
      getPhotoset(cam.camera, cam.lens, function(err, photoset) {
        // docs is an array of all the documents in mycollection
        console.log(cam.name);
        res.render('camera', { cameras:  cameras, cam: cam, photoset: photoset });
      });
    }); 
 });
});







   var mongojs = require('mongojs');
var fs = require('fs');
var csv = require('ya-csv');

// DB setup

var db_url = process.env.MONGOHQ_URL || 'mongodb://localhost:27020/cameralens'; 
var db = mongojs(db_url, ['photos', 'cameras', 'lenses']);

router.get('/import', function(req, res) {


db.cameras.ensureIndex( {name: 1}, {unique: true} );
db.lenses.ensureIndex( {name: 1}, {unique: true} );
db.photos.ensureIndex( {camera: 1} );
db.photos.ensureIndex( {lens: 1} );

// build camera data normalization dictionary
cameraNormalize = JSON.parse(fs.readFileSync("refine_cluster.json", "utf8")); 
dictionary = {}

cameraNormalize.forEach(function(column) {
  column.edits.forEach(function(type) {
    type.from.forEach(function(from) {
      dictionary[from] = type.to.trim();
    });
  });
});

var createCamera = function(cameraName, lensDoc, callback) {
  db.cameras.update({name: cameraName}, {'$setOnInsert': { name: cameraName }, '$addToSet': {lenses: lensDoc._id}}, {upsert: true}, function() {
    db.cameras.findOne({name: cameraName}, function(err, doc) {
      callback(err, doc);
    })
  });
}

var createLens = function(lensName, callback) {
  db.lenses.update({name: lensName}, {'$setOnInsert': { name: lensName }}, {upsert: true}, function() {
    db.lenses.findOne({name: lensName}, function(err, doc) {
      callback(err, doc);
    });
  });
}

var count = 0;
var finished = false;
var total = 0;

var reader = csv.createCsvFileReader('data/photo_meta.csv.small', 
                                     {columnsFromHeader:true, 
                                     'separator': ',',
                                     'quote':'"',
                                     'escape':'\\',
                                     'comment':''});

reader.addListener('data', function(data){

  ++total;

  // get normalized camera and lens
  var cameraName = dictionary[data.camera];
  if (cameraName == null) {
    cameraName = data.camera.trim();
  }
  var lensName = dictionary[data.lens];
  if (lensName == null) {
    lensName = data.lens.trim();
  }
 
  createLens(lensName, function(err, lensDoc) {
    createCamera(cameraName, lensDoc, function(err, cameraDoc) {
      db.photos.insert({
        camera: cameraDoc._id,
        lens: lensDoc._id,
        id: data.id,
        focal_length: data.focal_length,
        iso: data.iso,
        shutter_speed: data.shutter_speed,
        aperture: data.aperture,
        highest_rating: data.highest_rating
      }, function(err, doc) {
        if (++count % 10000 == 0) console.log(count);
        if (finished && count == total) {
          console.log("FINISHED");
          process.exit(0);
        }
      });

    });
  });


}); 

reader.addListener('end', function(){
  finished = true;
});



});




module.exports = router;
