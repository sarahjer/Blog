var mongoose = require("mongoose");

var blogSchema = new mongoose.Schema({
    id: {
            type: mongoose.Schema.Types.ObjectId
    },
    title: String,
    text: String,
    image: { data: String, contentType: String },
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        },
        ]
});

module.exports = mongoose.model("Blog", blogSchema);