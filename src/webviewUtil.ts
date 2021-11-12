import * as vscode from 'vscode';
import * as fs from 'fs';

export function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
	return {
		// Enable javascript in the webview
		enableScripts: true,

		// And restrict the webview to only loading content from our extension's `media` directory.
		localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
	};
}

export function writeJsonFile(newData: object) {
	let jsonPath = vscode.workspace.rootPath + '/.localhero.json'

	if(fs.existsSync(jsonPath)){
		console.log("Appending to .localhero.json file")
		fs.readFile(jsonPath, 'utf8', function readFileCallback(err, existingData){
            if (err){
                console.log(err);
            } else {
            let obj = JSON.parse(existingData); //now it an object
            obj.push(newData); //add some existingData
            let json = JSON.stringify(obj, null, 2); //convert it back to json
            fs.writeFile(jsonPath, json, 'utf8', function(err){
                if (err) throw err;
            });
        }});
	} else {
        let newDataArray = []
		console.log("Writing new .localhero.json file")
        newDataArray.push(newData)
		fs.writeFile (jsonPath, JSON.stringify(newDataArray, null, 2), 'utf8', function(err) {
			if (err) throw err;
			    console.log('complete');
			}
		);	
	}
}