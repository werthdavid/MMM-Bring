const NodeHelper = require("node_helper");
const BringClient = require("./BringClient");

let lists;
let currentList;
let client;
let config;

module.exports = NodeHelper.create({
    start: function () {
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "GET_LIST") {
            if (!this.client) {
                this.initClient(payload);
            } else {
                this.getList(payload);
                this.config = payload;
            }
            return true;
        } else if (notification === "PURCHASED_ITEM") {
            if (payload.purchase) {
                this.client.recently(payload.name, payload.listId).then(() => {
                    this.sendSocketNotification("RELOAD_LIST");
                });
            } else {
                this.client.purchase(payload.name, payload.listId).then(() => {
                    this.sendSocketNotification("RELOAD_LIST");
                });
            }

            return true;
        }
    },

    getList: function (payload) {
        if (this.client.mustLogin()) {
            this.initClient(payload.config);
        } else {
            this.client.getList(true, payload.listName).then(list => {
                this.currentList = list;
                this.sendSocketNotification("LIST_DATA", {lists: this.lists, currentList: list});
            });
        }
    },

    initClient: function (payload) {
        this.client = new BringClient(payload, this.path);
        // Wait for Login
        setTimeout(() => {
            if (!this.client.mustLogin()) {
                this.client.getLists().then(lists => {
                    this.lists = lists;
                    this.getList(payload);
                });
            }
        }, 1500);
    }
});
