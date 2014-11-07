var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');
var https = require('https');
var csv = require('ya-csv');
var _ = require('underscore');

// DB setup

var db_url = process.env.MONGOHQ_URL || 'mongodb://localhost:27020/cameralens'; 
var db = mongojs(db_url, ['photos', 'cameras', 'lenses',]);



function getCameras(callback){
  db.cameras.find().sort({
    photoCount: -1
  }).limit(30, callback); 
}

function getCamera(camera, callback){
  db.cameras.findOne({name: camera}, {lenses: 0}, callback); 
}

function getLens(lens, callback){
  db.lenses.findOne({name: lens}, callback); 
}

function getLenses(camera, callback) {
  db.cameras.findOne({name: camera}, function(err, docs) {
    db.lenses.find({
      name: { '$in': docs.lenses }
    }).sort({photoCount: -1}).limit(20, callback);
  });
}

function getPhotoset(camera, lens, callback){
  db.photos.find({camera: camera, lens: lens}).sort({highest_rating: -1}).limit(30, function(err, photos) {
    var count = 0;
    photos.forEach(function(photo) {
      console.log('Getting photo', photo.id);
      var req = https.request({
        host: 'api.500px.com',
        port: 443,
        path: '/v1/photos/' + photo.id + '?consumer_key=5258tqxlxoTBAdE3sAm2yA43eo5in6r8fSTqyEMt',
        method: 'GET'
      }, function(res) {
        res.on('data', function(data) {
          count++;
          var info = JSON.parse(data);
          photo.src = info.photo.image_url;
          photo.url = 'https://500px.com' + info.photo.url;
          if (count == photos.length) callback(err, photos);
        });
      });
      req.end();
      req.on('error', function(error) {
        console.log("ERROR!!!!!!!!!", error);
      });
    });
  });
}

function getPhotosFromCamera(camera, callback) {
  db.photos.find({camera: camera}).sort({highest_rating: -1}).limit(30, function(err, photos) {
    var count = 0;
    photos.forEach(function(photo) {
      console.log('Getting photo', photo.id);
      var req = https.request({
        host: 'api.500px.com',
        port: 443,
        path: '/v1/photos/' + photo.id + '?consumer_key=5258tqxlxoTBAdE3sAm2yA43eo5in6r8fSTqyEMt',
        method: 'GET'
      }, function(res) {
        res.on('data', function(data) {
          count++;
          var info = JSON.parse(data);
          photo.src = info.photo.image_url;
          photo.url = 'https://500px.com' + info.photo.url;
          if (count == photos.length) callback(err, photos);
        });
      });
      req.end();
      req.on('error', function(error) {
        console.log("ERROR!!!!!!!!!", error);
      });
    });
  });
}


function getFocalLengths(lens, callback) {
  db.photos.aggregate({
    '$match': {lens: lens}
  }, {
    '$group': {_id: "$focal_length", count: { '$sum': 1 }}
  }, function(err, docs) {
    docs = _.filter(docs, function(obj) { return obj._id != '' && !/^\d*\.0$/.test(obj._id) });
    docs = _.map(docs, function(obj) { obj._id = parseInt(obj._id, 10); return obj });
    docs = _.sortBy(docs, function(obj) { return obj._id });
    callback(err, docs);
  });
}


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
  
  getCamera(cameraName, function(err, cameraDoc) {
    getLenses(cameraName, function(err, lensDocs) {
      getPhotosFromCamera(cameraName, function(err, photoset) {
        res.render('camera', { cameraDoc: cameraDoc, lensDocs: lensDocs, cameraName: cameraName, photoset: photoset });
      });
    });
  });
});


// photoset given camera and lens
router.get('/camera/:camera/lens/:lens', function(req, res) {
  console.log('Showing camera: ', req.params.camera, ' and lens: ', req.params.lens)
  var cameraName = req.params.camera;
  var lensName = req.params.lens;
  
  getCamera(cameraName, function(err, cameraDoc) {
    getLens(lensName, function(err, lensDoc) {
      getPhotoset(cameraName, lensName, function(err, photoset) {
        getFocalLengths(lensName, function(err, focalLengths) {
          res.render('lenses', { 
            cameraName: cameraName, 
            lensName: lensName, 
            cameraDoc: cameraDoc, 
            lensDoc: lensDoc, 
            photoset: photoset, 
            focalLength: {
              _id: _.pluck(focalLengths, '_id'),
              count: _.pluck(focalLengths, 'count')
            } 
          });
        });
      });
    });
  });

});


router.get('/import', function(req, res) {
  require('../import.js');
});




module.exports = router;
