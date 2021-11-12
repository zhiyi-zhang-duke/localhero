import * as vscode from "vscode";
import { getNonce } from "./getNonce";
import { getWebviewOptions, writeJsonFile } from "./webviewUtil"

const cats = {
    'Coding Cat': 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif',
    'Compiling Cat': 'https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif',
    'Testing Cat': 'https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif'
};

/**
 * Manages cat coding webview panels
 */
export class ErrorLogPanel {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */
	public static currentPanel: ErrorLogPanel | undefined;

	public static readonly viewType = 'catCoding';

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];

    

	public static createOrShow(extensionUri: vscode.Uri) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it.
		if (ErrorLogPanel.currentPanel) {
			ErrorLogPanel.currentPanel._panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			ErrorLogPanel.viewType,
			'Error Log',
			column || vscode.ViewColumn.One,
			getWebviewOptions(extensionUri),
		);

		ErrorLogPanel.currentPanel = new ErrorLogPanel(panel, extensionUri);
        return ErrorLogPanel.currentPanel
	}

	public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		ErrorLogPanel.currentPanel = new ErrorLogPanel(panel, extensionUri);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programmatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(
			e => {
				if (this._panel.visible) {
					this._update();
				}
			},
			null,
			this._disposables
		);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'alert':
						vscode.window.showErrorMessage(message.text);
						return;
                    case 'save':
						vscode.window.showInformationMessage(`Saving error log about ${message.errorPath}`);
                        delete message.command
                        writeJsonFile(message)
                        if (ErrorLogPanel.currentPanel){
                            ErrorLogPanel.currentPanel.dispose()
                        }
						return;
				}
			},
			null,
			this._disposables
		);
	}

	public doRefactor() {
		// Send a message to the webview webview.
		// You can send any JSON serializable data.
		this._panel.webview.postMessage({ command: 'refactor' });
	}

    public logErrorAtFile(path: string){
        this._panel.webview.postMessage({ command: 'logErrorFile', path: `${path}` });
    }

	public dispose() {
		ErrorLogPanel.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	public _updateFilePath(path: string){
		const webview = this._panel.webview;

		console.log(`The path is ${path}`)
		this._panel.webview.html = this._getHtmlForWebview(webview, cats["Coding Cat"], path);
	}

	private _update() {
		const webview = this._panel.webview;

		// Vary the webview's content based on where it is located in the editor.
		switch (this._panel.viewColumn) {
			case vscode.ViewColumn.Two:
				this._updateForCat(webview, 'Compiling Cat');
				return;

			case vscode.ViewColumn.Three:
				this._updateForCat(webview, 'Testing Cat');
				return;

			case vscode.ViewColumn.One:
			default:
				this._updateForCat(webview, 'Coding Cat');
				return;
		}
	}

	private _updateForCat(webview: vscode.Webview, catName: keyof typeof cats) {
		this._panel.title = "Error Log";
		this._panel.webview.html = this._getHtmlForWebview(webview, cats[catName]);
	}

	private _getHtmlForWebview(webview: vscode.Webview, catGifPath: string, filePath?: string) {
		// Local path to main script run in the webview
		const scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js');

		// And the uri we use to load this script in the webview
		const scriptUri = (scriptPathOnDisk).with({ 'scheme': 'vscode-resource' });

        // const jqueryPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'media', 'jquery-3.6.0.min.js');
        // const jqueryUri = (jqueryPathOnDisk).with({ 'scheme': 'vscode-resource' });

		// Local path to css styles
		const styleResetPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css');
		const stylesPathMainPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css');

		// Uri to load styles into webview
		const stylesResetUri = webview.asWebviewUri(styleResetPath);
		console.log(`This is stylesResetUri ${stylesResetUri}`)
		const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);

		// Use a nonce to only allow specific scripts to be run
		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${stylesResetUri}" rel="stylesheet">
				<link href="${stylesMainUri}" rel="stylesheet">
                
				<title>Error Log</title>
			</head>
			<body>
				<img src="${catGifPath}" width="300" />
                <h1>Document Local Issue</h1>
                <form id="errorForm">
                <div class="form-group">
                    <label for="errorText">Error Output</label>
                    <textarea class="form-control" id="errorText" placeholder="Something went wrong." rows="4"></textarea>
                    <small id="errorTip" class="form-text text-muted">Be concise but when in doubt more is better</small>
                </div>
                <div class="form-group">
                    <label for="errorPath">Relevant File</label>
                    <input type="text" class="form-control" id="errorPath" placeholder="Leave this blank if it doesn't apply" rows="4" value="${filePath}"></input>
                </div>
				<div class="form-group">
                    <label for="errorLink">Relevant Link</label>
                    <input type="text" class="form-control" id="errorLink" placeholder="Jira or Slack or anything!">
                </div>
                <div class="form-group">
                    <label for="errorResolution">Steps to Fix</label>
                    <input type="text" class="form-control" id="errorResolution" placeholder="Turning it on and off.">
                </div>
                <div class="form-group">
                    <label for="reporterEmail">Email address</label>
                    <input type="email" class="form-control" id="reporterEmail" aria-describedby="emailHelp" placeholder="Enter email">
                </div>                
                <button type="submit" class="btn btn-primary">Submit</button>
                </form>
				<script nonce="${nonce}" src="${scriptUri}"></script>
                <script nonce="${nonce}" src="${jqueryUri}"></script>
			</body>
			</html>`;
	}
}