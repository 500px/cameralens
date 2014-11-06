var mongojs = require('mongojs');
var fs = require('fs');
var csv = require('ya-csv');

// DB setup

var db_url = process.env.MONGOHQ_URL || 'mongodb://localhost:27020/cameralens'; 
var db = mongojs(db_url, ['photos', 'cameras', 'lenses']);

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





/*db.cameras.save({ name: 'Canon' }, function(err, success){
  console.log("err=" + err + " success=" + success);
});
*/

//db.cameras.ensureIndex( ['name', 'mount'] )

/*db.cameras.findOne({name: "Canon"}, function(err, doc) {
  console.log(doc.name);
  process.exit(0);
});
*/
