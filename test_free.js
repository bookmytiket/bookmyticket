const { isFreeEvent } = require('./app/utils/eventUtils.js');
const event = {
  "id": "e4453b3c-97dc-4dbf-8f83-fc0538a8fca0",
  "title": "Pollachi Marathon",
  "price": null,
  "normal_ticket_price": null,
  "dynamic_config": {
    "seatingSections": [
      {
        "basePrice": 10
      }
    ]
  }
};
console.log("Is Free?", isFreeEvent(event));
