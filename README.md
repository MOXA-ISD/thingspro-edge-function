# Thingspro Edge Function VSCode Extension

Function as a service is a built-in feature of ThingsPro Edge which runs user programs with zero server management. More details of our product, please visit the [Website](https://www.moxa.com/en/products/industrial-computing/system-software/thingspro-edge-series).

ThingsPro team aware more users are getting used to develop their application by microsoft vscode instead directly login to device (including ourselves). In order to facility those developers, the extension for ThingsPro Edge Function has been uploaded to the marketplace!. You can install the latest version on vscode IDE or from the main page.

## Release Note

Please refer to [Changelog page](https://github.com/MOXA-ISD/tpe-function-extension/blob/main/CHANGELOG.md).

## SDK

| Platform | Package | Doc Site |
| :-------:| :------ | :------- |
| Python | [tpfunc](https://pypi.org/project/tpfunc/) | [https://thingspro-edge-tpfunc-doc.netlify.app/](https://thingspro-edge-tpfunc-doc.netlify.app/) |

## Templates of Function

Some templates of ThingsPro Edge Function are available on [GitHub](https://github.com/MOXA-ISD/tpe-function-extension). Including:
1. data driven
2. http server
3. pubsub
4. access

## Commands

- **TPE Function: Configuration** - Setup the parameters relevant to your development device.
![configuration gif](https://github.com/MOXA-ISD/tpe-function-extension/blob/main/assets/vscode-configuration.gif?raw=true)

- **TPE Function: Add** - Update function code under workspace to your device.
![add gif](https://github.com/MOXA-ISD/tpe-function-extension/blob/main/assets/vscode-add.gif?raw=true)

- **TPE Function: List** - Show function list on your device.
![list gif](https://github.com/MOXA-ISD/tpe-function-extension/blob/main/assets/vscode-list.gif?raw=true)

- **TPE Function: Start Log** - Display target function streamly debug messages.
![list gif](https://github.com/MOXA-ISD/tpe-function-extension/blob/main/assets/vscode-log.gif?raw=true)

- **TPE Function: Stop Log** - Stop displaying target function streamly debug messages.

- **TPE Function: Start** - Start target function on your device.

- **TPE Function: Stop** - Stop target function on your device.

- **TPE Function: Delete** - Delete target function on your device.
