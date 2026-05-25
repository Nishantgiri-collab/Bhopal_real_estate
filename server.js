// server.js
// Root entry point for Hostinger Node.js Web App deployment

console.log("🚀 Starting Bhopal Real Estate application from root entry point...");

const express = require('express');
const path = require('path');
// Redundant DB initialization removed; main logic resides in server/index.js

const frontendDistPath = path.join(__dirname, 'dist');

require("./server/index.js");
