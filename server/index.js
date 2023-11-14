import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRouter from './Routes/routes.js';
import dotenv from 'dotenv';
import {WebSocketServer} from "ws";
import cookieParser from 'cookie-parser';
import jwt from "jsonwebtoken";
import {Chats, Users} from "./dB/models.js";
dotenv.config();

const app = express();

const PORT = 3000;
export const secret = process.env.SECRET;

mongoose
    .connect(process.env.URI, { dbName: "Chat-App" })
    .catch((e) => console.log(e));

app.use(express.json());
app.use(cors({
    credentials: true,
    origin: 'http://localhost:5173',
}));
app.use(cookieParser());
app.use('',authRouter);

const server = app.listen(PORT, () => {
    console.log(`listening on ${PORT}...${typeof process.env.URI}`);
});

const wss = new WebSocketServer({server});
wss.on("connection", (connection, req)=>{
    const urlParams = new URLSearchParams(req.url.split("?")[1]);
    const token = urlParams.get('token');
    jwt.verify(token,secret,{},(err, data)=>{
        if (err){
            console.log(err);
        }
        connection.username = data.username;
        connection.userId = data.userId;
    });
    for (const client of [...wss.clients]) {
        client.send(JSON.stringify({
            online: [...wss.clients].map(c => c.username),
        }))
    }
    connection.on("message", async (message)=>{
        const parsedMessage = JSON.parse(message);
        const {sender, receiver, text} = parsedMessage.message;
        if(receiver && text){
            const receiverId = await Users.findOne({username: receiver});
            const senderId = await Users.findOne({username: sender});
            const msgDoc = await Chats.create({
                message: text,
                senderId: senderId,
                receiverId: receiverId
            });

            [...wss.clients]
                .filter(c => c.username === receiver)
                .forEach(c => c.send(JSON.stringify({
                    text,
                    sender: c.username,
                    messageId: msgDoc._id
                })));
        }
    });
});