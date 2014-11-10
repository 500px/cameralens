(function() {



var mongojs = require('mongojs');
var fs = require('fs');
var csv = require('ya-csv');

// DB setup

var db_url = process.env.MONGOHQ_URL || 'mongodb://localhost:27020/cameralens'; 
var db = mongojs(db_url, ['photos', 'cameras', 'lenses']);

db.cameras.ensureIndex({ name: 1 }, { unique: true, background: true });
db.lenses.ensureIndex({ name: 1 }, { unique: true, background: true });
db.photos.ensureIndex({ camera: 1, lens: 1}, { background: true });

// build camera data normalization dictionary
cameraNormalize = JSON.parse(fs.readFileSync("refine_cluster.json", "utf8")); 
dictionary = {}

cameraNormalize.forEach(function(column) {
  column.edits.forEach(function(type) {
    type.from.forEach(function(from) {
      dictionary[from] = String(type.to);
    });
  });
});



var createCamera = function(cameraName, lensName, callback) {
  db.cameras.update({
    name: cameraName
  }, {
    '$setOnInsert': {
      name: cameraName
    }, '$addToSet': {
      lenses: lensName
    }, '$inc': {
      photoCount: 1
    }
  }, {upsert: true}, function() {
    db.cameras.findOne({name: cameraName}, function(err, doc) {
      if (err) console.log("CAMERA ERROR!", err);
      callback(err, doc);
    })
  });
}

var createLens = function(lensName, callback) {
  db.lenses.update({
    name: lensName
  }, {
    '$setOnInsert': { 
      name: lensName
    }, '$inc': {
      photoCount: 1
    }
  }, {upsert: true}, function() {
    db.lenses.findOne({name: lensName}, function(err, doc) {
      if (err) console.log("LENSES ERROR!", err);
      callback(err, doc);
    });
  });
}

var count = 0;
var finished = false;
var total = 0;

var lensCount = 0;
var cameraCount = 0;

var reader = csv.createCsvFileReader('data_sample.csv', 
                                     {'separator': ',',
                                     'quote':'"',
                                     'escape':'\\',
                                     'comment':''});

reader.setColumnNames(['id', 'camera', 'lens', 'focal_length', 'iso', 'shutter_speed', 'aperture', 'highest_rating']);

reader.addListener('data', function(data){

  ++total;

  // get normalized camera and lens
  var cameraName = dictionary[data.camera];
  if (cameraName == null) {
    cameraName = String(data.camera).trim();
  }
  var lensName = dictionary[data.lens];
  if (lensName == null) {
    lensName = String(data.lens).trim();
  }

  if (lensCount == 0 && (total % 10000 == 0 || total == 1)) console.log("Finished processing CSV file row #", total);
  createLens(lensName, function(err, lensDoc) {
    if (cameraCount == 0 && (++lensCount % 1000 == 0 || lensCount == 1)) console.log("Finished processing lens for photo #", lensCount);
    createCamera(cameraName, lensName, function(err, cameraDoc) {
      if (count == 0 && (++cameraCount % 1000 == 0 || cameraCount == 1)) console.log("Finished processing camera for photo #", cameraCount);
      db.photos.insert({
        camera: cameraName,
        lens: lensName,
        id: data.id,
        focal_length: data.focal_length,
        iso: data.iso,
        shutter_speed: data.shutter_speed,
        aperture: data.aperture,
        highest_rating: data.highest_rating
      }, function(err, doc) {
        if (++count % 1000 == 0 || count == 1) console.log("Done processing photo #", count); 
        if (finished && count == total) {
          console.log("FINISHED processing photos!");
          process.exit(0); 
        }
        data = null;// prevents memory leaks
        return null;// memory leak?
      });
    });
  });
}); 

reader.addListener('end', function(){
  finished = true;
});

}).call(this);
