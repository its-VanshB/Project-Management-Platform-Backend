import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./db/data_base_connection.js";

dotenv.config({
    path :"./.env"
});

const port = process.env.PORT || 8000;

connectDB()
    .then(()=>{
        app.listen(3000 , ()=>{
            console.log(`port is listening at ${port}`);
        });
    })
    .catch((err)=>{
        console.error("Mongo db connection error" , err);
        process.exit();
    });
