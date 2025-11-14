/**
 * @module Database
 * 
 * This module is responsible for initializing and managing the database connections.
 * It includes functions to connect to the database, handle connection errors, and close the connection gracefully.
 * 
 */

import mongoose from "mongoose";
import logger from "../utils/logger.util.js";
import CONFIG from "../configs/api.config.js";
const { MONGODB } = CONFIG;

/**
 * @method initDB
 * Connect to MongoDB using Mongoose
**/
export const initDB = async () => {
  try {
    const dbOptions = {
      dbName: MONGODB.NAME,
      maxPoolSize: 10, // Optimize for high concurrency
      serverSelectionTimeoutMS: 5000, // Shorter timeout for better responsiveness
      socketTimeoutMS: 45000 // Keep sockets open longer
    };
    await mongoose.connect(MONGODB.URI, dbOptions);
    logger.info("Database connected successfully");
  } catch (error) {
    logger.error(`Database connection error: ${error.message}`);
    throw error;
  }
};


export const getMongoose = () => mongoose;

/**
 * @method quitDB
 * Gracefully disconnect MongoDB connection
**/
export const quitDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info("Database disconnected successfully");
  } catch (error) {
    logger.error(`Database disconnection error: ${error.message}`);
    throw error;
  }
};