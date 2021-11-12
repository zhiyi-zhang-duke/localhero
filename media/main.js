// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
    const vscode = acquireVsCodeApi();

    const oldState = /** @type {{ count: number} | undefined} */ (vscode.getState());

    const counter = /** @type {HTMLElement} */ (document.getElementById('lines-of-code-counter'));
    console.log('Initial state', oldState);

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        console.log(event)
        const message = event.data; // The json data that the extension sent
        switch (message.command) {
            case 'logErrorFile':
                document.getElementById("errorPath").value = message.path;
                break;
        }
    });

    const form = document.querySelector('form')
    form.addEventListener('submit', event => {
        var errorLogMessage = {}
        errorLogMessage.command = "save"
        errorLogMessage.errorText = document.getElementById('errorText').value
        errorLogMessage.errorPath = document.getElementById('errorPath').value
        errorLogMessage.errorLink = document.getElementById('errorLink').value
        errorLogMessage.errorResolution = document.getElementById('errorResolution').value
        errorLogMessage.reporterEmail = document.getElementById('reporterEmail').value

        vscode.postMessage(errorLogMessage);
    })
}());