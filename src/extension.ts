// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import { ErrorLogPanel } from "./ErrorLogPanel";
import { ErrorResultsPanel } from "./ErrorResultsPanel";
import { useErrorInputBox, searchJsonFile } from "./ErrorInputBox";
import { getWebviewOptions } from "./webviewUtil";
import * as fs from 'fs';
import { window } from 'vscode';

function getRelativePath() {
	if (vscode.window.activeTextEditor !== undefined) {
		let currentlyOpenTabfilePath = vscode.window.activeTextEditor.document.fileName;
		let folderName = vscode.workspace.name; // get the open folder name
		let folderPath = vscode.workspace.rootPath; // get the open folder path
		
		// TODO: (jackz) technically all three of these variables could be null
		let relativePath = currentlyOpenTabfilePath.replace(folderPath!, "./" + folderName)
		console.log(`${relativePath}`)
		return relativePath
	} else {
		return ""
	}
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "localhero" is now active!');

	context.subscriptions.push(
		vscode.commands.registerCommand('localhero.logError', async () => {
			let relativePath = getRelativePath()
			ErrorLogPanel.createOrShow(context.extensionUri);
			if (ErrorLogPanel.currentPanel) {
				// ErrorLogPanel.currentPanel.logErrorAtFile(relativePath);
				ErrorLogPanel.currentPanel._updateFilePath(relativePath);
			}
		})
	)

	context.subscriptions.push(
		vscode.commands.registerCommand('localhero.cats', () => {
			vscode.window.showInformationMessage("Writing a json file!")
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('localhero.searchError', async () => {
			const error = await useErrorInputBox()
			// const results = await useErrorInputBox() //Display input box and searches input
			// TODO: take the result of the searchJsonFile function and create the results via ErrorResultsPanel
			console.log(`error is: ${error}`)

			const relevantErrorEntries = await searchJsonFile(error!)
			console.log(`relevantErrorEntries is: ${relevantErrorEntries}`)
			// ErrorResultsPanel.createOrShow(context.extensionUri, [])
		})
	);	

	if (vscode.window.registerWebviewPanelSerializer) {
		// Make sure we register a serializer in activation event
		vscode.window.registerWebviewPanelSerializer(ErrorLogPanel.viewType, {
			async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
				console.log(`Got state: ${state}`);
				// Reset the webview options so we use latest uri for `localResourceRoots`.
				webviewPanel.webview.options = getWebviewOptions(context.extensionUri);
				ErrorLogPanel.revive(webviewPanel, context.extensionUri);
			}
		});
	}
}

// this method is called when your extension is deactivated
export function deactivate() {}
