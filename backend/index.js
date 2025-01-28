// dependencies
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

// middleware for enabling CORS (Cross-Origin Resource Sharing)
app.use(cors());

// middleware for parsing json
app.use(express.json()); // Middleware to parse incoming JSON data into `req.body`.

// connect to mongodb with backwards compatibility
const mongoURI = "mongodb://127.0.0.1:27017/user_management";
const mongoOptions = { useNewUrlParser: true, useUnifiedTopology: true };
// useNewUrlParser: true ensures your MongoDB connection string is interpreted correctly, especially if it has complex elements like special characters or SRV records.
// useUnifiedTopology: true makes your app handle database connections more efficiently and reliably.
mongoose
  .connect(mongoURI, mongoOptions)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Counter schema for auto increment of id's
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Key to identify the counter (e.g., 'userId').
  seq: { type: Number, default: 0 }, // Counter value (auto-incrementing ID).
});

const Counter = mongoose.model("Counter", counterSchema);

// User schema
const userSchema = new mongoose.Schema({
  //user schema with auto increment id
  _id: { type: Number },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  age: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// function to get next sequence id
function getNextSequence(name) {
  return Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  ).then(function (counter) {
    return counter.seq;
  });
}

const User = mongoose.model("User", userSchema);

// Create - add new User
app.post("/api/users", async (req, res) => {
  getNextSequence("userId")
    .then(function (userId) {
      const user = new User({
        _id: userId,
        ...req.body,
      });
      return user.save();
    })
    .then(function (savedUser) {
      res.status(201).json(savedUser);
    })
    .catch(function (err) {
      res.status(400).json({ message: err.message });
    });
});

// Read - get all users
app.get("/api/users", function (req, res) {
  User.find()
    .sort({ _id: 1 }) // sort by id in ascending order
    .then(function (users) {
      res.json(users);
    })
    .catch(function (err) {
      res.status(500).json({ message: err.message });
    });
});

// Read - get user by id
app.get("/api/users/:id", function (req, res) {
  User.findById(Number(req.params.id))
    .then(function (user) {
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    })
    .catch(function (err) {
      res.status(500).json({ message: err.message });
    });
});

// Update - update user by id
app.put("/api/users/:id", function (req, res) {
  User.findByIdAndUpdate(Number(req.params.id), req.body, { new: true })
    .then(function (updatedUser) {
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    })
    .catch(function (err) {
      res.status(400).json({ message: err.message });
    });
});

// Delete - delete user by id
app.delete("/api/users/:id", function (req, res) {
  User.findByIdAndDelete(Number(req.params.id))
    .then(function (deletedUser) {
      if (!deletedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    })
    .catch(function (err) {
      res.status(500).json({ message: err.message });
    });
});

// listen on port 3000
const PORT = 3000;

app.listen(PORT, function () {
  console.log(`Server running on port ${PORT}`);
});
