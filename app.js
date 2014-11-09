var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var engine = require('ejs-locals'); 
var os = require('os'); 

var app = express();

console.log('process.env.MONGOHQ_URL : ',process.env.MONGOHQ_URL)

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', engine); //added to support local layouts
app.set('view engine', 'ejs');
 
// Standard express setup
app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());

// Session store setup to reboot server and persist sessions
var session    = require('express-session');

app.use(express.static(path.join(__dirname, 'public'))); 

app.use('/', require('./routes/camera'));

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// development error handler
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: err
    });
});

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + server.address().port);
});
