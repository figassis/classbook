var express = require('express');
var compress = require('compression');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
//var nodemailer = require('nodemailer');
//var mandrill = require('mandrill-api/mandrill');
//var mandrill_client = new mandrill.Mandrill(process.env.mailpass);

var sendgrid = require('sendgrid')(process.env.sendgrid_key);
//var bcrypt = require('bcrypt-nodejs');
//var async = require('async');
//var crypto = require('crypto');

var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var ConnectRoles = require('./roles');

var database = process.env.DATABASE;

mongoose.connect('mongodb://localhost/' + database, function(err) {
    if (err) {
        console.log('connection error', err);
    } else {
        console.log('connection successful');
    }
});


//Remember to configure cors for all routes
var cors = require('cors');
var whitelist = ['https://classbook.co', 'https://classbook.co:3000', 'http://www.classbook.co', 'http://www.classbook.co:3000', 'https://classbook.nellcorp.com', 'https://classbook.nellcorp.com:3000'];

var corsOptions = {
    origin: function(origin, callback) {
        var originIsWhitelisted = whitelist.indexOf(origin) !== -1;
        callback(null, originIsWhitelisted);
    }
};


var routes = require('./routes/index');
var User = require('./models/User');
var users = require('./routes/users');
var absences = require('./routes/absences');
var auth = require('./routes/auth');
var schools = require('./routes/schools');
var signups = require('./routes/signups');
var courses = require('./routes/courses');
var subjects = require('./routes/subjects');
var coursenames = require('./routes/coursenames');
var subjectnames = require('./routes/subjectnames');
var schedules = require('./routes/schedules');
var groups = require('./routes/groups');
var sessions = require('./routes/sessions');
var data_import = require('./routes/import');
var data_export = require('./routes/export');

var app = express();
app.use(compress());

app.use(function(req, res, next) {
    //res.header("Access-Control-Allow-Origin", "https://classbook.nellcorp.com:3000");

    var origin = req.get('origin');

    if (whitelist.indexOf(origin) > -1) {
        res.header("Access-Control-Allow-Origin", origin);
    }
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header('Access-Control-Allow-Credentials', true);
    //res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
        res.sendStatus(200);
    } else {
        next();
    }
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json({
    limit: '1mb'
}));
app.use(bodyParser.urlencoded({
    extended: false,
    limit: '1mb'
}));
app.use(cookieParser());
var session = require('express-session');

app.use(session({
    secret: 'mycroft acia',
    resave: false,
    saveUninitialized: false
}));


app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

//passport.use(new LocalStrategy(User.authenticate()));
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

var restrict = function(req, res, next) {
    var url = req.url;
    var parts = url.split('/');
    if (parts.length == 4) {
        url = '/' + parts[1] + '/' + parts[2];
    }

    var open = ['/auth/login', '/auth/valid', '/auth/register', '/signup', '/auth/reset', '/auth/restore', '/auth/tokens'];

    if (req.user || open.indexOf(url) > -1) {
        next();
    } else {
        res.sendStatus(401);
    }
};

app.use(restrict);

app.use(ConnectRoles);

app.use('/', routes);
app.use('/auth', auth);
app.use('/users', users);
app.use('/absences', absences);
app.use('/schools', schools);
app.use('/signup', signups);
app.use('/courses', courses);
app.use('/subjects', subjects);
app.use('/coursenames', coursenames);
app.use('/subjectnames', subjectnames);
app.use('/schedules', schedules);
app.use('/groups', groups);
app.use('/sessions', sessions);
app.use('/import', data_import);
app.use('/export', data_export);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.json({
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json({
        message: err.message,
        error: {}
    });
});

module.exports = app;