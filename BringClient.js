const axios = require("axios").default;
const Store = require("data-store");
const querystring = require("querystring");
const https = require("https");

class BringClient {
    /**
     * This is an Axios client instance that is intended for making authenticated requests to
     * the 'api.getbring.com' domain using normal TLS rules.
     */
    #authenticatedClient;
    /**
     * This is an Axios client instance that won't fail a request if there's issues with the SSL certificate.
     * This is necessary for requests to the 'web.getbring.com' domain as long as their certificate chain
     * still includes a broken "Sectigo" certificate.
     */
    #insecureClient;
    constructor(opts, modulePath) {
        this.userId = undefined;
        this.articles = undefined;
        this.defaultListId = "";
        this.store = new Store({path: modulePath + "/bring.config.json", cwd: "store"});
        this._init(opts);
    }

    _init(opts) {
        this.locale = "de-DE";
        if (opts.locale) {
            this.locale = opts.locale;
        }

        this.#insecureClient = axios.create({
            baseURL: "https://web.getbring.com/",
            headers: {
                "x-bring-api-key": "cof4Nc6D8saplXjE3h3HXqHH8m7VU2i1Gs0g85Sp"
            },
            httpsAgent: new https.Agent({
                // This setting disables SSL certificate errors and reduces security
                rejectUnauthorized: false
            })
        });

        this.#authenticatedClient = axios.create({
            baseURL: "https://api.getbring.com/rest/v2/",
            headers: {
                "x-bring-api-key": "cof4Nc6D8saplXjE3h3HXqHH8m7VU2i1Gs0g85Sp"
            },
        });

        if (this.mustLogin()) {
            this.login(opts.email, opts.password).then(() => {
                this.userId = this.store.get("user_id");
                this.defaultListId = this.store.get("default_list_id");
                this.#authenticatedClient.defaults.headers.common["Authorization"] = "Bearer " + this.store.get("access_token");
            });
        } else {
            this.userId = this.store.get("user_id");
            this.defaultListId = this.store.get("default_list_id");
            this.#authenticatedClient.defaults.headers.common["Authorization"] = "Bearer " + this.store.get("access_token");
        }
    }

    mustLogin() {
        return !this.store.get("access_token") || !this.store.get("valid_until") || new Date().getTime() > this.store.get("valid_until");
    }

    login(email, password) {
        return this.#authenticatedClient
        .post(
            "/bringauth",
            querystring.stringify({
            email: email,
            password: password
            })
        )
        .then((response) => {
                const loginObj = response.data;
                this.store.set("user_id", loginObj["uuid"]);
                this.store.set("default_list_id", loginObj["bringListUUID"]);
                this.store.set("access_token", loginObj["access_token"]);
                this.store.set("valid_until", new Date().getTime() + (loginObj["expires_in"] * 1000));
            }).catch(error => {
                console.error("Error while Logging-in with Bring-Client in MMM-Bring:", "HTTP" + error.response.status, error.response.data);
            });
    }

    getLists() {
        return this.#authenticatedClient
        .get(
            "/bringusers/" + this.userId + "/lists"
        )
        .then((response) => {
                // Remember the names of the Lists
                for (let i = 0, len = response.data.lists.length; i < len; i++) {
                    this.store.set("list_name_" + response.data.lists[i].listUuid, response.data.lists[i].name);
                    this.store.set("list_id_" + response.data.lists[i].name, response.data.lists[i].listUuid);
                }
                return response.data.lists;
        })
        .catch((error) => console.error(error));
    }

    getList(withDetails, listName) {
        let listId = this.defaultListId;
        if (!!listName) {
            listId = this.store.get("list_id_" + listName);
        }
        return this.#authenticatedClient
        .get("/bringlists/" + listId)
        .then((response) => {
                const list = response.data;
                if (list && list.uuid) {
                    list.name = this.store.get("list_name_" + list.uuid);
                }
                return list;
            }
        ).then(list => {
            if (withDetails && !this.articles) {
                return this.getArticles().then((articles) => {
                        this.articles = articles;
                        return list;
                });
            } else {
                return list;
            }
        })
        .then((list) => {
            if (withDetails) {
                return this.getListDetails(listId).then(details => {
                        const detailsMap = {};
                        for (let i = 0, len = details.length; i < len; i++) {
                            detailsMap[details[i].itemId] = details[i];
                        }
                        for (let i = 0, len = list.purchase.length; i < len; i++) {
                            list.purchase[i].details = detailsMap[list.purchase[i].name];
                            list.purchase[i].imageSrc = this.getImageSrc(list.purchase[i]);
                            // Translate it
                            if (
                                this.articles &&
                                this.articles[list.purchase[i].name] != null
                            ) {
                                list.purchase[i].name = this.articles[list.purchase[i].name];
                            }
                        }
                        for (let i = 0, len = list.recently.length; i < len; i++) {
                            list.recently[i].details = detailsMap[list.recently[i].name];
                            list.recently[i].imageSrc = this.getImageSrc(list.recently[i]);
                            // Translate it
                            if (
                                this.articles &&
                                this.articles[list.recently[i].name] != null
                            ) {
                                list.recently[i].name = this.articles[list.recently[i].name];
                            }
                        }
                        return list;
                    });
            } else {
                return list;
            }
        }).catch(error => console.error(error));
    }

    getListDetails(listId) {
        return this.#authenticatedClient
        .get("/bringlists/" + listId + "/details")
        .then((response) => {
            return response.data;
        }).catch(error => console.error(error));
    }

    getArticles(locale) {
        if (!locale) {
            locale = this.locale;
        }
        const axiosResponseData = this.#insecureClient
            .get(`/locale/articles.${locale}.json`)
            .then((response) => response.data)
            .catch((e) => console.error(e));

        return axiosResponseData;
    }

    getImageSrc(item) {
        let name = item.name;
        if (item.details && item.details.userIconItemId) {
            name = item.details.userIconItemId;
        }
        if (
            this.articles &&
            JSON.stringify(this.articles)
                .toLowerCase()
                .indexOf(name.toLowerCase()) === -1
        ) {
            const articleKeys = Object.keys(this.articles).map(key => key.toLowerCase());
            let foundAlternativeImage = false;
            for (let i = 0, len = articleKeys.length; i < len; i++) {
                if (item.name.toLowerCase().indexOf(articleKeys[i]) >= 0) {
                    name = articleKeys[i];
                    foundAlternativeImage = true;
                    break;
                }
            }
            if (!foundAlternativeImage) {
                name = item.name.substr(0, 1);
            }
        }
        return "https://web.getbring.com/assets/images/items/" + name
            .replace(/[.*+-?^${}()|/[\]\\]/g, "_")
            .replace(/&/g, "_")
            .replace(/\s/g, "_")
            .replace(/ä/ig, "ae")
            .replace(/ö/ig, "oe")
            .replace(/ü/ig, "ue")
            .replace(/__/g, "_")
            .replace(/__/g, "_")
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // è, é
            .toLowerCase() + ".png";
    }

    purchase(itemName, listId) {
        const config = {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        };
        return this.#authenticatedClient
        .put(
            "/bringlists/" + listId,
            querystring.stringify({
            uuid: listId,
            purchase: itemName
        }), config).catch(error => console.error(error));
    }

    recently(itemName, listId) {
        const config = {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        };
        return this.#authenticatedClient
        .put(
            "/bringlists/" + listId,
            querystring.stringify({
            uuid: listId,
            recently: itemName
        }), config).catch(error => console.error(error));
    }
}

module.exports = BringClient;
