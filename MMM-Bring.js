Module.register("MMM-Bring", {

    defaults: {
        email: "",
        password: "",
        updateInterval: 15,
        listName: undefined,
        activeItemColor: "#EE524F",
        latestItemColor: "#4FABA2",
        showLatestItems: false,
        maxItems: 0,
        maxLatestItems: 0,
        locale: "de-DE"
    },

    getStyles: function () {
        return [this.file('css/styles.css')];
    },

    start: function () {
        this.list = undefined;
        this.sendSocketNotification("GET_LIST", this.config);
        setInterval(() => {
            this.sendSocketNotification("GET_LIST", this.config);
        }, this.config.updateInterval * 60 * 1000);
    },

    getDom: function () {
        const container = document.createElement("div");
        container.className = "bring-list-container bring-" + this.data.position;

        if (this.list && this.list.name) {
            const title = document.createElement("h3");
            title.innerText = this.list.name;
            container.appendChild(title);
        }

        // Purchase
        if (this.list && this.list.purchase) {
            const bringList = document.createElement("div");
            bringList.className = "bring-list";
            let max = this.list.purchase.length;
            if (this.config.maxItems !== 0) {
                max = this.config.maxItems;
            }
            for (let i = 0, len = max; i < len; i++) {
                const bringListItem = document.createElement("div");
                bringListItem.className = "bring-list-item-content";
                bringListItem.style = "background-color: " + this.config.activeItemColor;
                bringListItem.onclick = () => this.itemClicked({name: this.list.purchase[i].name, purchase: true, listId: this.list.uuid});

                const upperPartContainer = document.createElement("div");
                upperPartContainer.className = "bring-list-item-upper-part-container";
                const imageContainer = document.createElement("div");
                imageContainer.className = "bring-list-item-image-container";
                const image = document.createElement("img");
                image.src = this.list.purchase[i].imageSrc;
                imageContainer.appendChild(image);
                upperPartContainer.appendChild(imageContainer);

                bringListItem.appendChild(upperPartContainer);


                const itemTextContainer = document.createElement("div");
                itemTextContainer.className = "bring-list-item-text-container";
                const itemName = document.createElement("span");
                itemName.className = "bring-list-item-name";
                itemName.innerText = this.list.purchase[i].name;
                itemTextContainer.appendChild(itemName);

                const itemSpec = document.createElement("span");
                itemSpec.className = "bring-list-item-specification-label";
                itemSpec.innerText = this.list.purchase[i].specification;
                itemTextContainer.appendChild(itemSpec);

                bringListItem.appendChild(itemTextContainer);

                bringList.appendChild(bringListItem);
            }
            container.appendChild(bringList);
        }
        if (this.config.showLatestItems && this.list && this.list.recently) {
            const bringListRecent = document.createElement("div");
            bringListRecent.className = "bring-list";

            let max = this.list.recently.length;
            if (this.config.maxLatestItems !== 0) {
                max = this.config.maxLatestItems;
            }
            for (let i = 0, len = max; i < len; i++) {
                const bringListItem = document.createElement("div");
                bringListItem.className = "bring-list-item-content";
                bringListItem.style = "background-color: " + this.config.latestItemColor;
                bringListItem.onclick = () => this.itemClicked({name: this.list.recently[i].name, purchase: false, listId: this.list.uuid});

                const upperPartContainer = document.createElement("div");
                upperPartContainer.className = "bring-list-item-upper-part-container";
                const imageContainer = document.createElement("div");
                imageContainer.className = "bring-list-item-image-container";
                const image = document.createElement("img");
                image.src = this.list.recently[i].imageSrc;
                imageContainer.appendChild(image);
                upperPartContainer.appendChild(imageContainer);

                bringListItem.appendChild(upperPartContainer);


                const itemTextContainer = document.createElement("div");
                itemTextContainer.className = "bring-list-item-text-container";
                const itemName = document.createElement("div");
                itemName.className = "bring-list-item-name";
                itemName.innerText = this.list.recently[i].name;
                itemTextContainer.appendChild(itemName);

                const itemSpec = document.createElement("div");
                itemSpec.className = "bring-list-item-specification-label";
                itemSpec.innerText = this.list.recently[i].specification;
                itemTextContainer.appendChild(itemSpec);

                bringListItem.appendChild(itemTextContainer);

                bringListRecent.appendChild(bringListItem);
                container.appendChild(bringListRecent);
            }
        }
        return container;
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "LIST_DATA") {
            this.list = payload;
            this.updateDom(1000);
        } else  if (notification === "RELOAD_LIST") {
            this.sendSocketNotification("GET_LIST", this.config);
        }
    },

    itemClicked: function (item) {
        this.sendSocketNotification("PURCHASED_ITEM", item);
    }

});
