const express = require('express')
const mongoose = require('mongoose')
const { MONGO_USER, MONGO_PASSWORD, MONGO_IP, MONGO_PORT } = require("./config/config")

const postRouter = require("./routes/postRoutes")

const app = express()

const mongoURL = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_IP}:${MONGO_PORT}/?authSource=admin`
console.log('===========================')
console.log('mongourl:', mongoURL)
console.log('===========================')

const connectWithRetry = () => {
    mongoose
        .connect(mongoURL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
        })
        .then(() => console.log('succesfully connected to DB'))
        .catch((e) => {
            console.log(e)
            console.log('retry connecting every 5 seconds...')
            setTimeout(connectWithRetry, 5000)
        })
}

connectWithRetry()

app.use(express.json())

app.get("/", (req, res) => {
    res.send("<h2>hi there!!!</h2>")
})

app.use("api/v1/posts", postRouter)

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`listening on port ${port}`))











