import express from "express";
import bodyParser from "body-parser";
import axios from "axios";


const app = express();
const port = 3000;

app.set('view engine', 'ejs');


app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());


let posts = [
  {
    id: 1,
    avatar: "XX",
    author: "Author 1",
    post_time: "hours",
    content: "Starting a new school year is always a mix of excitement...",
  },
  {
    id: 2,
    avatar: "XY",
    author: "Author 2",
    post_time: "hours",
    content: "Test Lorem Ipsum dolorem" 
  },


];


app.get("/", (req, res) => {
    res.render("index", { posts });
});

app.listen(port, (req, res) => {
    console.log(port);
});
