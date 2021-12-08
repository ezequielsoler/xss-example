var express = require('express');
var session = require('express-session');
var serverStatic = require('serve-static');
var app = express();
const fs = require('fs');

const items = ["Item 1", "Iteam 2", "Iteam 3", "Iteam 4"]

app.set('views', './views');

// Se indica el motor del plantillas a utilizar
app.set('view engine', 'pug');

// Sessions are used by web applications to remember data about specific users.
// This is how when you login to a website, it remembers you for a while.
app.use(session({
	secret: 'my-secret',
	resave: true,
	saveUninitialized: true,
	cookie: {
		httpOnly: false
	}
}));

app.get('/', function (req, res) {
	let search = req.query.q || ''
	const results = '<ul>' + items.reduce((html, item) => {
		return html + "<li>" + item + "</li>";
	}, "") + '</ul>';
	const template = fs.readFileSync('./views/index.html', 'utf8');
	search = search.replace(/<script.*>.*<\/script>/i, " ")
	let view = template.replace('$search$', search);
	view = view.replace('$results$', results);
	res.send(view);
});

// Start listening to requests on the local machine at port 3000.
app.listen(3000, function () {
	console.log('Server listening at localhost:3000');
});
