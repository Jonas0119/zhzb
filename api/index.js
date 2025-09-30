// Vercel serverless function entry point
const handler = require('../backend/dist/main.js').default;

module.exports = handler;
