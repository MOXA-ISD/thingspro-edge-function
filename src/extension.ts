// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as https from 'https';
import fetch from 'node-fetch';

import { exit, openStdin } from 'process';
import { strict } from 'assert';
const { Client } = require('ssh2');
const { writeFile, mkdir } = require('fs');
const { join } = require('path');
import { ConfigManager } from './config';


enum MsgLevel {
	Info = 1,
	Warn,
	Error,
}

let username: string = "";
let password: string = "";
let ipAddr: string = "";
let token: string = "";

let mgr = new ConfigManager();
let connPreview = new Client();
let outputChannel: vscode.OutputChannel



function is_configured(): boolean {
	return username != "" && password != "" && ipAddr != "" && token != ""
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	outputChannel = vscode.window.createOutputChannel(`ThingsPro Edge Function output`);
    outputChannel.show(true);

	subscribeCommand(context, 'thingspro-edge-function.configuration', addConfiguration)
	subscribeCommand(context, 'thingspro-edge-function.list', listFunction)
	subscribeCommand(context, 'thingspro-edge-function.add', addFunction)
	subscribeCommand(context, 'thingspro-edge-function.start', startFunction)
	subscribeCommand(context, 'thingspro-edge-function.stop', stopFunction)
	subscribeCommand(context, 'thingspro-edge-function.start-log', startLogFunction)
	subscribeCommand(context, 'thingspro-edge-function.stop-log', stopLogFunction)
	subscribeCommand(context, 'thingspro-edge-function.delete', deleteFunction)

	if (await mgr.initialization()) {
		username = mgr.get_value('username')
		password = Buffer.from(mgr.get_value('password'), 'base64').toString()
		ipAddr = mgr.get_value('ipaddr')
		token = Buffer.from(mgr.get_value('token'), 'base64').toString()
		console.log(token)
		if (is_configured()) {
			showMessage(MsgLevel.Info, "Previous Configuration Loaded")
		}
	}
}

export function subscribeCommand(context: vscode.ExtensionContext,
	commandID: string, callback: (...args: any[]) => any) {
	let disposable = vscode.commands.registerCommand(commandID, callback)
	context.subscriptions.push(disposable);
}

export async function showInputBox() {
	const result = await vscode.window.showInputBox({
		placeHolder: 'your function name'
	});
	vscode.window.showInformationMessage(`Got: ${result}`);
}

export function showMessage(level: number, message: string) {
	switch (level) {
		case MsgLevel.Info:
			vscode.window.showInformationMessage(message)
			break
		case MsgLevel.Warn:
			vscode.window.showWarningMessage(message)
			break
		case MsgLevel.Error:
			vscode.window.showErrorMessage(message)
			break
		default:
			vscode.window.showErrorMessage(`unknow message type: ${message}`)
	}
}

export async function addConfiguration() {
	const target = await vscode.window.showInputBox({
		prompt: 'IP address',
		placeHolder: '10.144.49.81',
		ignoreFocusOut: true,
	});
	const re = new RegExp('^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])')
	if (!re.test(`${target}`)) {
		showMessage(MsgLevel.Error, 'Invalid IP address format.')
		return
	}
	ipAddr = `${target}`;

	const name = await vscode.window.showInputBox({
		placeHolder: 'your console login username, ex. moxa',
		prompt: 'User name',
		ignoreFocusOut: true,
	});
	if ((name === undefined) || (`${name}` === '')) {
		showMessage(MsgLevel.Error, 'Invalid username.')
		return
	}
	username = `${name}`;

	const passwd = await vscode.window.showInputBox({
		placeHolder: 'your console login password.',
		prompt: 'Password',
		password: true,
		ignoreFocusOut: true,
	});
	if ((passwd === undefined) || (`${passwd}` === '')) {
		showMessage(MsgLevel.Error, 'Invalid passwd.')
		return
	}
	password = `${passwd}`;

	const command = `sudo -S cat /var/thingspro/data/mx-api-token`
	const conn = new Client();
	conn.on('ready', () => {
		conn.exec(command, {pty: true}, (err: any, stream: any) => {
		  if (err) throw err;
		  stream.on('data', (data: any) => {
			if (data.includes('[sudo] password for moxa:')) {
				stream.write(`${password}\n`);
			} else if (data.includes('\r')) {
				console.warn('invalid string, skip: ' + data)	
			} else {
				token = String(data)
				return
			}
		  })
		  .stderr.on('data', (data: any) => {
			showMessage(MsgLevel.Error, 'STDERR: ' + data)
		  });
		  stream.on('exit', function(code: any, signal: any) {
			conn.end();
			if (!is_configured()) {
				showMessage(MsgLevel.Info, 'Login remote device failure.')
				return
			}
			mgr.set_value('ipaddr', ipAddr)
			mgr.set_value('username', username)
			mgr.set_value('password', Buffer.from(token.trim()).toString('base64'))
			mgr.set_value('token', Buffer.from(token.trim()).toString('base64'))
			mgr.write_to_file()
			showMessage(MsgLevel.Info, 'Configuration Updated')
		  });
		});
	  }).connect({
		host: ipAddr,
		username: username,
		password: password
	  });
}

export async function listFunction() {
	if (!is_configured()) {
		showMessage(MsgLevel.Error, "Missing some information of Configuration, Please configure again.")
		return
	}
	const command = `export PATH=$PATH:/var/bruno/apps/function/bin; sudo -S env PATH=$PATH tpfunc ls`
	let message: string = ''
	const conn = new Client();
	conn.on('ready', () => {
		conn.exec(command, {pty: true}, (err: any, stream: any) => {
		  if (err) throw err;
		  stream.on('data', (data: any) => {
			if (data.includes('[sudo] password for moxa:')) {
				stream.write(`${password}\n`);
			} else {
				message += data
			}
		  })
		  .stderr.on('data', (data: any) => {
			showMessage(MsgLevel.Error, 'STDERR: ' + data)
		  });
		  stream.on('exit', function(code: any, signal: any) {
			outputChannel.append(message)
			outputChannel.appendLine('')
			conn.end();
		  })
		  .stderr.on('data', (data: any) => {
			showMessage(MsgLevel.Error, 'STDERR: ' + data)
		  });
		});
	  }).connect({
		host: ipAddr,
		username: username,
		password: password
	  });
}

export async function startLogFunction() {
	if (!is_configured()) {
		showMessage(MsgLevel.Error, "Missing some information of Configuration, Please configure again.")
		return
	}
	const result = await vscode.window.showInputBox({
		prompt: 'Preview function name'
	});

	outputChannel.appendLine('+------+--------+------+------------+-------+-------+\n\
+------+--------+    Log Begin    +-------+-------+\n')

	const command = `export PATH=$PATH:/var/bruno/apps/function/bin; sudo -S env PATH=$PATH tpfunc log ${result}`
	connPreview = new Client();
	connPreview.on('ready', () => {
		connPreview.exec(command, {pty: true}, (err: any, stream: any) => {
		  if (err) throw err;
		  stream.on('data', (data: any) => {
			if (data.includes('[sudo] password for moxa:')) {
				stream.write(`${password}\n`);
			} else {
				outputChannel.append(data.toString())
			}
		  })
		  .stderr.on('data', (data: any) => {
			console.log('STDERR: ' + data);
		  });
		  stream.on('exit', function(code: any, signal: any) {
			connPreview.end();
		  });
		});
	  }).connect({
		host: ipAddr,
		username: username,
		password: password
	  });
	  showMessage(MsgLevel.Info, 'Preview started.')
}

export async function stopLogFunction() {
	if (!is_configured()) {
		showMessage(MsgLevel.Error, "Missing some information of Configuration, Please configure again.")
		return
	}
	if (connPreview) {
		connPreview.end()
	}
	outputChannel.appendLine('+------+--------+    Log End     +-------+-------+\n\
+------+--------+------+------------+-------+-------+')
	showMessage(MsgLevel.Info, 'Preview stopped.')
}

export async function addFunction() {
	if (!is_configured()) {
		showMessage(MsgLevel.Error, "Missing some information of Configuration, Please configure again.")
		return
	}
	let indexPath = vscode.Uri.parse(mgr.get_config_path("index.py"))
	let packagePath = vscode.Uri.parse(mgr.get_config_path("package.json"))
	let getIndexText = vscode.workspace.openTextDocument(indexPath).then((document) => {
		return document.getText();
	  });

	let getPackageText = vscode.workspace.openTextDocument(packagePath).then(async (document) => {
		try {
			let indexText = await getIndexText
			if (!indexText) {
				throw new Error("index.py not found")
			}
			let jsonObj = JSON.parse(document.getText())
			if (!jsonObj.executable) {
				jsonObj.executable = {}
			}
			jsonObj.executable.context = indexText
			return JSON.stringify(jsonObj)
		} catch(e) {
			outputChannel.appendLine("failed to load files: " + e)
			return null
		}
	  });

	let response: any;
	const body = await getPackageText
	if (!body) {
		showMessage(MsgLevel.Error, 'Failed to load index.py or package.json')
		return
	}
	const httpsAgent = new https.Agent({
		rejectUnauthorized: false,
	});
	try {
		response = await fetch(`https://${ipAddr}:8443/api/v1/function`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
				'mx-api-token': token
			},
			body: body,
			agent: httpsAgent
		});
	} catch (e) {
		showMessage(MsgLevel.Error, e)
		return
	}
	const message = (response.status === 200)? 'Function updated' : await response.text();
	showMessage(MsgLevel.Info, message)
}

export async function startFunction() {
	if (!is_configured()) {
		showMessage(MsgLevel.Error, "Missing some information of Configuration, Please configure again.")
		return
	}
	let indexPath = vscode.Uri.parse(mgr.get_config_path("index.py"))
	let packagePath = vscode.Uri.parse(mgr.get_config_path("package.json"))
	let getIndexText = vscode.workspace.openTextDocument(indexPath).then((document) => {
		return document.getText();
	});
	let getPackageText = vscode.workspace.openTextDocument(packagePath).then(async (document) => {
		let indexText = await getIndexText
		let jsonObj = JSON.parse(document.getText());
		jsonObj.executable.context = indexText;
		jsonObj.enabled = true
		return JSON.stringify(jsonObj)
	});

	const body = await getPackageText
	const httpsAgent = new https.Agent({
		rejectUnauthorized: false,
	});
	const response = await fetch(`https://${ipAddr}:8443/api/v1/function`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			'mx-api-token': token
		},
		body: body,
		agent: httpsAgent
	});

	const message = (response.status === 200)? 'Function started' : await response.text();
	showMessage(MsgLevel.Info, message)
}

export async function stopFunction() {
	if (!is_configured()) {
		showMessage(MsgLevel.Error, "Missing some information of Configuration, Please configure again.")
		return
	}
	let indexPath = vscode.Uri.parse(mgr.get_config_path("index.py"))
	let packagePath = vscode.Uri.parse(mgr.get_config_path("package.json"))
	let getIndexText = vscode.workspace.openTextDocument(indexPath).then((document) => {
		return document.getText();
	  });
	let getPackageText = vscode.workspace.openTextDocument(packagePath).then(async (document) => {
		let indexText = await getIndexText
		let jsonObj = JSON.parse(document.getText());
		jsonObj.executable.context = indexText;
		jsonObj.enabled = true
		return JSON.stringify(jsonObj)
	  });

	const body = await getPackageText
	const httpsAgent = new https.Agent({
		rejectUnauthorized: false,
	});
	const response = await fetch(`https://${ipAddr}:8443/api/v1/function`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			'mx-api-token': token
		},
		body: body,
		agent: httpsAgent
	});

	const message = (response.status === 200)? 'Function stopped' : await response.text();
	showMessage(MsgLevel.Info, message)
}

export async function deleteFunction() {
	const result = await vscode.window.showInputBox({
		prompt: "Delete Function Name."
	});
	// Display a message box to the user
	const httpsAgent = new https.Agent({
		rejectUnauthorized: false,
	});
	const response = await fetch(`https://${ipAddr}:8443/api/v1/function?id=${result}`, {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json',
			'mx-api-token': token
		},
		agent: httpsAgent
	});
	const message = (response.status === 200)? 'Function deleted' : await response.text();
	showMessage(MsgLevel.Info, message)
}

// this method is called when your extension is deactivated
export function deactivate() {}
