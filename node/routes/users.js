var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var User = require('../models/User.js');

/* GET /todos listing. */
router.get('/', function(req, res, next) {
  User.find(function (err, users) {
    if (err) return next(err);
    res.json(users);
  });
});

/* POST /todos */
router.post('/', function(req, res, next) {
  req.body.supervisor = {firstname: req.body.supervisor_firstname, lastname: req.body.supervisor_lastname, email: req.body.supervisor_email, phone: req.body.supervisor_phone};
    
    delete req.body.supervisor_firstname;
    delete req.body.supervisor_lastname;
    delete req.body.supervisor_email;
    delete req.body.supervisor_phone;

  User.create(req.body, function (err, post) {
    if (err) return next(err);
    
    res.json(post);
  });
});

/* GET /todos/id */
router.get('/:id', function(req, res, next) {
  User.findById(req.params.id, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* PUT /todos/:id */
router.put('/:id', function(req, res, next) {
  User.findByIdAndUpdate(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* DELETE /todos/:id */
router.delete('/:id', function(req, res, next) {
  User.findByIdAndRemove(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
})

module.exports = router;
