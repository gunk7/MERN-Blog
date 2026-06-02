const express = require("express");
const route = express.Router();
const webhookController = require("../controllers/webhookController");

route.post("/", webhookController.handleStripeWebhook);
module.exports = route;
