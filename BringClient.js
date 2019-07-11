const axios = require("axios");
const Store = require("data-store");

class BringClient {

    constructor(opts) {
        this.userId = "";
        this.defaultListId = "";
        this.store = new Store({path: "bring.config.json", cwd: "store"});
        this._init(opts);
    }

    _init(opts) {
        if (this.mustLogin()) {
            this.login(opts.email, opts.password);
        }
        this.locale = "de-DE";
        if (opts.locale) {
            this.locale = opts.locale;
        }
        this.articles = undefined;
        this.userId = this.store.get("user_id");
        this.defaultListId = this.store.get("default_list_id");
        axios.defaults.headers.common["Authorization"] = "Bearer " + this.store.get("access_token");
        axios.defaults.headers.common["X-BRING-API-KEY"] = "cof4Nc6D8saplXjE3h3HXqHH8m7VU2i1Gs0g85Sp";
    }

    mustLogin() {
        return !this.store.get("access_token") || !this.store.get("valid_until") || new Date().getTime() > this.store.get("valid_until");
    }

    login(email, password) {
        axios.post("https://api.getbring.com/rest/v2/bringauth", {
            email,
            password
        }).then(function (response) {
            const loginObj = response.data;
            this.store.set("user_id", loginObj["uuid"]);
            this.store.set("default_list_id", loginObj["bringListUUID"]);
            this.store.set("access_token", loginObj["access_token"]);
            this.store.set("valid_until", new Date().getTime() + (loginObj["expires_in"] * 1000));
        });
        this.store.set("user_id", loginObj["uuid"]);
        this.store.set("default_list_id", loginObj["bringListUUID"]);
        this.store.set("access_token", loginObj["access_token"]);
        this.store.set("valid_until", new Date().getTime() + (loginObj["expires_in"] * 1000));
    }

    getLists() {
        return axios.get("https://api.getbring.com/rest/v2/bringusers/" + this.userId + "/lists").then(response => {
                // Remember the names of the Lists
                for (let i = 0, len = response.data.lists.length; i < len; i++) {
                    this.store.set("list_name_" + response.data.lists[i].listUuid, response.data.lists[i].name);
                    this.store.set("list_id_" + response.data.lists[i].name, response.data.lists[i].listUuid);
                }
                return response.data.lists;
            }
        );
    }

    getList(withDetails, listName) {
        let listId = this.defaultListId;
        if (!!listName) {
            listId = this.store.get("list_id_" + listName);
        }
        return axios.get("https://api.getbring.com/rest/v2/bringlists/" + listId).then(response => {
                const list = response.data;
                if (list && list.uuid) {
                    list.name = this.store.get("list_name_" + list.uuid);
                }
                return list;
            }
        ).then(list => {
            if (withDetails && !this.articles) {
                return this.getArticles().then(articles => {
                        this.articles = articles;
                        return list;
                    }
                );
            } else {
                return list;
            }
        }).then(list => {
            if (withDetails) {
                return this.getListDetails(listId).then(details => {
                        const detailsMap = {};
                        for (let i = 0, len = details.length; i < len; i++) {
                            detailsMap[details[i].itemId] = details[i];
                        }
                        for (let i = 0, len = list.purchase.length; i < len; i++) {
                            list.purchase[i].details = detailsMap[list.purchase[i].name];
                            list.purchase[i].imageSrc = this.getImageSrc(list.purchase[i]);
                        }
                        for (let i = 0, len = list.recently.length; i < len; i++) {
                            list.recently[i].details = detailsMap[list.recently[i].name];
                            list.recently[i].imageSrc = this.getImageSrc(list.recently[i]);
                        }
                        return list;
                    }
                );
            } else {
                return list;
            }
        });
    }

    getListDetails(listId) {
        return axios.get("https://api.getbring.com/rest/v2/bringlists/" + listId + "/details").then(response => {
                return response.data;
            }
        );
    }

    getArticles(locale) {
        if (!locale) {
            locale = this.locale;
        }
        return axios.get("https://web.getbring.com/locale/articles." + locale + ".json").then(response => {
                return response.data;
            }
        );
    }

    getImageSrc(item) {
        let name = item.name;
        if (item.details && item.details.userIconItemId) {
            name = item.details.userIconItemId;
        }
        if (JSON.stringify(this.articles).toLowerCase().indexOf(name.toLowerCase()) === -1) {
            name = item.name.substr(0, 1);
        }
        return "https://web.getbring.com/assets/images/items/" + name
            .replace(/[.*+-?^${}()|/[\]\\]/g, "_")
            .replace(/&/g, "_")
            .replace(/\s/g, "_")
            .replace(/ä/g, "ae")
            .replace(/ö/g, "oe")
            .replace(/ü/g, "ue")
            .replace(/__/g, "_")
            .replace(/__/g, "_")
            .toLowerCase() + ".png";
    }
}

module.exports = BringClient;
