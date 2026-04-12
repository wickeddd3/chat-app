import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";

dotenv.config();

const app = express();
app.use(cors());

const port = process.env.PORT || 4000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Your React dev URL
    methods: ["GET", "POST"],
  },
});
