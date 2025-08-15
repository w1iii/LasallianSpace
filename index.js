import express from "express";
import bodyParser from "body-parser";
import axios from "axios";


const app = express();
const port = 3000;

app.set('view engine', 'ejs');


app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());


app.get("/", (req, res) => {
    res.render("index");
});

app.listen(port, (req, res) => {
    console.log(port);
});
