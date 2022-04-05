const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash")
require("dotenv").config()

const password = process.env.PASSWORD 


const app = express();


app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(`mongodb+srv://admin-jeckdix:${password}@cluster0.d1etq.mongodb.net/todolistDB`);

const itemsSchema = new mongoose.Schema({ name: String });

const Item = mongoose.model("item", itemsSchema);

const item1 = new Item({ name: "I need to cook" });
const item2 = new Item({ name: "Clean the house" });
const item3 = new Item({ name: "Do laundry." });

const defaultList = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const List = mongoose.model("List", listSchema);

/*
- Find all documents in the Item collection 
- Check if collection is empty
  - If yes
    - Insert array of default items
    - Redirect to home route 
  - If no
    - render the ejs list template, passing in the returned collection. 
*/

app.get("/", async (req, res) => {
  try {
    const ItemCollection = await Item.find({});
    if (ItemCollection.length === 0) {
      await Item.insertMany(defaultList);
      return res.redirect("/");
    }
    return res.render("list", {
      listTitle: "Today",
      newListItems: ItemCollection,
    });
  } catch (error) {
    console.log(error);
  }
});

app.post("/", async function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  try {
    const item = await new Item({ name: itemName });

    if (listName === "Today") {
      item.save();
      return res.redirect("/");
    } else {
      const customListName = await List.findOne({ name: listName });

      customListName.items.push(item);
      customListName.save();
      res.redirect("/" + listName);
    }
  } catch (error) {
    console.log(error);
  }
});

app.post("/delete", async (req, res) => {
  try {
    const checkedItemId = await req.body.checkbox;
    const listName = req.body.listName 
    if (listName === "Today") {
      await Item.findByIdAndDelete(checkedItemId);
      res.redirect("/");
    } else {
      const checkedListItem = await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}})
      res.redirect("/" + listName)
    }

  } catch (error) {
    console.log(error);
  }
});

app.get("/:customListName", async (req, res) => {
  const customListName = _.capitalize (req.params.customListName);


  const checkedListItem = await List.findOne({ name: customListName });
  try {
    if (!checkedListItem) {
      const list = await new List({
        name: customListName,
        items: defaultList,
      });
      await list.save();
      return res.redirect(customListName);
    }
    return res.render("list", {
      listTitle: checkedListItem.name,
      newListItems: checkedListItem.items,
    });
  } catch (error) {
    console.log(error);
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});


app.listen(process.env.PORT || 4000);
