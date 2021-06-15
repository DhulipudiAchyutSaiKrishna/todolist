//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const lodash = require("lodash");
const app = express();

app.set('view engine', 'ejs');
mongoose.set('useFindAndModify', false);

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser : true, useUnifiedTopology : true});

const itemsSchema = {
  name : {
    type : String,
    required : true
  }
};

const Item = mongoose.model("Item", itemsSchema);

const One = new Item({
  name : "Welcome to your todolist"
});

const Two = new Item({
  name : "Hit + to add a new Item"
});

const Three = new Item({
  name : "<-- Hit this to delete the Item"
});

const defaultItems = [One, Two, Three];

const listSchema = {
  name : String,
  items : [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  Item.find({}, (err, results)=>{
    if(results.length === 0){
      Item.insertMany(defaultItems, (err)=>{
        if(err){
          console.log(err);
        }else{
          console.log("Succesfully added the defaultItems");
        }
      });
      res.redirect("/");
    } else{
      res.render("list", {listTitle: "Today", newListItems: results});
    }
    // console.log(results);
  });

});

app.get("/:listType", (req, res)=>{
  const listType = lodash.capitalize(req.params.listType);
  // console.log(req.params.listType);
  List.findOne({name : listType}, (err, foundList)=>{
    if(!err){
      if(!foundList){
        console.log("Doesnt exists");  // then Create a new list

        const list = new List({
          name : listType,
          items : defaultItems
        });
        list.save();
        res.redirect("/" + listType);
      }else{
        console.log("Exists");
        console.log(foundList.name);  //then redirect to that
        res.render("list", {listTitle : foundList.name, newListItems : foundList.items});
      }
    }
  });


});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name : itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name : listName}, (err, foundList)=>{
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", (req,res)=>{
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  // console.log("Deleting from : " + listName);

  if(listName === "Today"){
      Item.findByIdAndRemove(checkedItemId, (err)=>{
        if(!err){
          console.log("Successfully deleted : " + checkedItemId);
          res.redirect("/");
        }else{
          console.log(err);
        }
      });
  }else{
    List.findOneAndUpdate({name : listName}, {$pull : {items : {_id : checkedItemId}}}, (err, foundList)=>{
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }

});

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
