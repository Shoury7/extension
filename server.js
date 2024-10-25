if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const uri = "mongodb://localhost:27017/leetvault";
const app = express();
const PORT = 3000;
const dBUrl = process.env.ATLAS_URL;
// Middleware
app.use(cors()); // Enable CORS
app.use(bodyParser.json()); // Parse JSON bodies
// mongoose
//   .connect(uri)
//   .then(() => {
//     console.log("Connected to MongoDB successfully");
//   })
//   .catch((error) => {
//     console.error("MongoDB connection error:", error);
//   });
async function main() {
  await mongoose.connect(dBUrl);
}
main()
  .then(() => {
    console.log("connected to the database");
  })
  .catch((err) => {
    console.log(err);
  });
// Define the question schema
const questionSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^https?:\/\/.+\..+/.test(v); // Basic validation for URL format
      },
      message: (props) => `${props.value} is not a valid URL!`,
    },
  },
  question: { type: String, required: true },
  difficulty: {
    type: String,
    required: true,
    enum: ["easy", "medium", "hard"],
  },
  topic: { type: String, required: true },
  remarks: {
    type: String,
  },
});

// Define the user schema with an array of questions
const userSchema = new mongoose.Schema({
  userName: { type: String, required: true, unique: true }, // Ensure username is unique
  questions: [questionSchema], // Array of questions
});

// Create Mongoose models
const User = mongoose.model("User", userSchema);

// Route to handle the POST request
app.post("/api/submit", async (req, res) => {
  const { userName, question, difficulty, topic, url, remarks } = req.body;

  if (!userName || !question) {
    return res
      .status(400)
      .json({ error: "Username and question are required" });
  }

  // Create a new question object based on the schema
  const newQuestion = {
    url,
    question,
    difficulty,
    topic,
    remarks,
  };

  try {
    // Check if the user already exists in the database
    let user = await User.findOne({ userName });

    if (user) {
      // If the user exists, push the new question to the questions array
      user.questions.push(newQuestion);
    } else {
      // If the user does not exist, create a new user with the question
      user = new User({
        userName,
        questions: [newQuestion], // Initialize with the first question
      });
    }

    // Save the user document (either newly created or updated)
    await user.save();
    console.log("Received: ", req.body);
    res
      .status(200)
      .json({ message: "Question received successfully!", question });
  } catch (error) {
    console.error("Error saving the question:", error);
    res.status(500).json({ error: "Failed to save question" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
