const express = require('express')
const mongoose = require('mongoose')
const session = require('express-session')
const cors = require('cors')
const redis = require('redis')
const { 
    MONGO_USER, 
    MONGO_PASSWORD, 
    MONGO_IP, 
    MONGO_PORT,  
    REDIS_URL,
    REDIS_PORT,
    SESSION_SECRET,
} = require("./config/config")
let RedisStore = require("connect-redis")(session)
let redisClient = redis.createClient({
    host: REDIS_URL, port: REDIS_PORT
})


const postRouter = require("./routes/postRoutes")
const userRouter = require("./routes/userRoutes")

const app = express()

const mongoURL = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_IP}:${MONGO_PORT}/?authSource=admin`

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

app.enable("trust proxy") //this line tells express is behind a proxy.
app.use(cors({}))
app.use(session({
    store: new RedisStore({client: redisClient}),
    secret: SESSION_SECRET,
    cookie: {
        secure: false,
        resave: false,
        saveUninitialized: false,
        httpOnly: true,
        maxAge: 60000,
    }
}))

app.use(express.json())

app.get("/api", (req, res) => {
    res.send("<h2>hi there???!!!</h2>")
    console.log("front end log")
})
//this app has no frontend and you should add nginx setting when you add frontend.

app.use("/api/v1/posts", postRouter)
app.use("/api/v1/users", userRouter)


const port = process.env.PORT || 3000
app.listen(port, () => console.log(`listening on port ${port}`))











