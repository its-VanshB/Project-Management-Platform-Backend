import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

//basic configurations or middlewares
app.use(express.json({limit : "16kb"}));
app.use(express.urlencoded({extended:true , limit:"16kb"}));
app.use(express.static("public"));
app.use(cookieParser());

//cors configuration
app.use(cors({
    origin : process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
    credentials : true,
    methods : ["GET" , "POST" , "PUT" , "OPTIONS" , "DELETE" , "PATCH"],
    allowedHeaders : ["Content-Type" , "Authorization"]
}));

import healthCheckRouter from "./routes/healthcheck.routes.js";
app.use("/api/v1/healthcheck" , healthCheckRouter);

import authRouter from "./routes/auth.routes.js";
app.use("/api/v1/auth",authRouter);

app.get("/" , (req,res)=>{
    res.send("welcome to project");
});

export default app;
