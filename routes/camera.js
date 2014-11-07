var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');

var csv = require('ya-csv');

// DB setup

var db_url = process.env.MONGOHQ_URL || 'mongodb://localhost:27020/cameralens'; 
var db = mongojs(db_url, ['photos', 'cameras', 'lenses',]);


function getCameras(callback){
  db.cameras.find().sort({
    photoCount: -1
  }).limit(10, callback); 
}

function getLenses(camera, callback) {
  db.cameras.findOne({name: camera}, function(err, docs) {
    db.lenses.find({
      _id: { '$in': docs.lenses }
    }).sort().limit(20, callback);
  });
}

function getPhotoset(camera, lens, callback){
  // lens is optional
  var find = {camera: camera}
  if (lens) find.lens = lens;

  db.photos.find(find).sort({highest_rating: -1}).limit(60, callback);
  // return 50 photos, ordere by DESC 
}

function getPhotosFromCamera(camera, callback) {
  db.photos.find({camera: camera}).sort({highest_rating: -1}).limit(60, callback);
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

// Homepage
router.get('/', function(req, res) {
  getCameras(function(err, cameras) {
      // docs is an array of all the documents in mycollection
      res.render('home', { cameras: cameras || []  });
  });
});


// camera details
router.get('/camera/:name', function(req, res) {
  console.log('Showing camera: ', req.params.name);
  var cameraName = req.params.name;
  
  getCameras(function(err, cameras) {
    getPhotosFromCamera(cameraName, function(err, photoset) {
      // docs is an array of all the documents in mycollection
      console.log('Processing camera ', cameraName);
      res.render('camera', { cameras: cameras, cameraName: cameraName, photoset: photoset });
    });
  });
});


// photoset given camera and lens
router.get('/camera/:camera/lens/:lens', function(req, res) {
  console.log('Showing camera: ', req.params.camera, ' and lens: ', req.params.lens)
  
  getPhotoset(function(cameras){
    db.cameras.findOne({name: req.params.name}, function(err, cam) {
      getPhotoset(cam.camera, cam.lens, function(err, photoset) {
        // docs is an array of all the documents in mycollection
        console.log(cam.name);
        res.render('camera', { cameras:  cameras, cam: cam, photoset: photoset });
      });
    }); 
 });
});








router.get('/import', function(req, res) {
  require('../import.js');
});




module.exports = router;
