var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db')


var app = express();
var PORT = process.env.PORT || 3000;
var todos = []
var todoNextId = 1
app.use(bodyParser.json())
app.get('/', function(req, res) {
    res.send('To do api root')
})

app.get('/todos', function(req, res) {
    var queryParams = req.query;
    var where = {};
    if (queryParams.hasOwnProperty('completed') && (queryParams.completed === "true")) {
        where.completed = true
    } else if (queryParams.hasOwnProperty('completed') && (queryParams.completed === "false")) {
        where.completed = false
    }
    if (queryParams.hasOwnProperty('q') && (queryParams.q.length > 0)) {
        where.description = {
            $like: `%${queryParams.q}%`
        }
    }
    res

    db.todo.findAll({
        where: where
    }).then(function(todos) {
        res.json(todos)

    }, function(e) {
        res.status(500).send(e)
    })
        
})

app.get('/todos/:id', function(req, res) {
    var todoId = parseInt(req.params.id, 10)

    db.todo.findById(todoId).then(function(todo) {
        if (!!todo) {
            res.json(todo)
        } else {
            res.status(404).send();
        }
    }, function(err) {
        res.status(500).json(err)
    })

})

app.post('/todos', function(req, res) {
    var body = _.pick(req.body, 'description', 'completed')

    db.todo.create(body).then(function(todo) {
        res.json(todo.toJSON())
    }, function(e) {
        res.status(400).json(e)
    })
})

app.delete('/todos/:id', function(req, res) {
    var todoId = parseInt(req.params.id, 10)
    var matchedTodo = _.findWhere(todos, { id: todoId })
    if (!matchedTodo) {
        res.status(404).json({ "error": "No Todo found with that id" })
    } else {
        todos = _.without(todos, matchedTodo)
        res.status(200).send(matchedTodo)
    }
})

app.put('/todos/:id', function(req, res) {
    var todoId = parseInt(req.params.id, 10)
    var matchedTodo = _.findWhere(todos, { id: todoId })
    var body = _.pick(req.body, 'description', 'completed')

    var validAttributes = {}
    if (!matchedTodo) {
        return res.status(404).send();
    }
    if (body.hasOwnProperty('completed') && _.isBoolean(body.completed)) {
        validAttributes.completed = body.completed
    } else if (body.hasOwnProperty('completed')) {
        return res.status(400).send();
    }

    if ((body.hasOwnProperty('description')) && (_.isString(body.description)) && (body.description.trim().length > 0)) {
        validAttributes.description = body.description
    } else if (body.hasOwnProperty('description')) {
        return res.status(400).send
    }



    _.extend(matchedTodo, validAttributes)
    res.json(matchedTodo)


})

db.sequelize.sync().then(function() {
    app.listen(PORT, function() {
        console.log(`listening on port ${PORT}`)
    })
});

