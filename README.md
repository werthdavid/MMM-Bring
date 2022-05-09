# MMM-Bring

![Alt text](/img/readme/example.png "A preview of the MMM-Bring module.")

A module for the [MagicMirror²](https://github.com/MichMich/MagicMirror/) that displays your [Bring!](https://www.getbring.com) shopping list.

## Features
 * Touch Support
 * Locale Support
 * Auto-Layout

## Installing

### Step 1 - Install the module
```javascript
cd ~/MagicMirror/modules
git clone https://github.com/werthdavid/MMM-Bring.git
cd MMM-Bring
npm install
```

### Step 2 - Add module to `~MagicMirror/config/config.js`
Add this configuration into `config.js` file's
```json5
{
    module: "MMM-Bring",
    position: "bottom_bar",
    config: {
       email: "USER@EXAMPLE.COM",
       password: "SECRET",
       updateInterval: 15, // in Minutes
       listName: "Zuhause", // optional
       showListName: true,
       activeItemColor: "#EE524F",
       latestItemColor: "#4FABA2",
       showLatestItems: false,
       maxItems: 0,
       maxLatestItems: 0,
       locale: "de-DE",
       useKeyboard: false,
       customHeader: "My shopping list", // optional
       listDropdown: true
    }
}
```
## Updating
Go to the module’s folder inside MagicMirror modules folder and pull the latest version from GitHub and install:
```
git pull
npm install
```
## Configuring
Here is the configurable part of the module

| Option               | Description
|--------------------- |-----------
| `email`              | *Required* Email-address.
| `password`           | *Required* password.
| `updateInterval`     | How often the module should load the list.<br>**Type:** `number` in minutes<br> **Default value:** `15`
| `listName`           | The name of the list to be displayed. <br>**Type:** `string` <br> **Default value:** your default list
| `showListName`       | Flag for displaying list name. <br>**Type:** `boolean` <br> **Default value:** `true`
| `activeItemColor`    | Color for active items. <br>**Type:** `string` <br> **Default value:** `#EE524F`
| `latestItemColor`    | Color for recent items. <br>**Type:** `string` <br> **Default value:** `#4FABA2`
| `showLatestItems`    | Flag for displaying recently bought items. <br>**Type:** `boolean` <br> **Default value:** `false`
| `maxItems`           | Maximum items to display. <br>**Type:** `number` <br> **Default value:** `0` (all)
| `maxLatestItems`     | Maximum recent items to display. <br>**Type:** `number` <br> **Default value:** `0` (all)
| `locale`             | The locale. <br>**Type:** `string` <br> **Default value:** `de-DE`
| `useKeyboard`        | Activate to use this module together with MMM-Keyboard <br>**Type:** `boolean` <br> **Default value:** `false`
| `customTitle`       | Show the given text as generic module title <br>**Type:** `string` <br> **Default value:** `undefined` (empty)
| `listDropdown`       | If you have more than 1 list, show a dropdown where the list can be selected <br>**Type:** `boolean` <br> **Default value:** `true`

### Valid locales

* de-AT
* de-CH
* de-DE
* es-ES
* en-GB
* en-US
* en-CA
* en-AU
* fr-CH
* fr-FR
* it-CH
* it-IT
* pt-BR
* nl-NL
* hu-HU
* nb-NO
* pl-PL
* ru-RU
* sv-SE
* tr-TR
