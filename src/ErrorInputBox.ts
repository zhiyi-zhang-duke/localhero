import * as vscode from 'vscode';
import * as fs from 'fs';
const fuzzysort = require('fuzzysort')


// const { FuzzySet } = require('fuzzyset')
// import {FuzzySet} from "fuzzyset"

export async function getInputTest() {
    const result = await vscode.window.showInputBox({
        value: 'nullpointerexception',
        placeHolder: 'Copy and paste the keywords from your local environment error',
        // validateInput: text => {
        // 	window.showInformationMessage(`Validating: ${text}`);
        // 	return text === '123' ? 'Not 123!' : null;
        // }
    });
	return result 
}

export async function useErrorInputBox() {
    const result = await vscode.window.showInputBox({
        value: 'nullpointerexception',
        placeHolder: 'Copy and paste the keywords from your local environment error',
        // validateInput: text => {
        // 	window.showInformationMessage(`Validating: ${text}`);
        // 	return text === '123' ? 'Not 123!' : null;
        // }
    });
	const errorEntries = await searchJsonFile(result!)   
}

export async function searchJsonFile(errorSearch: string) {
	let jsonPath = vscode.workspace.rootPath + '/localhero.json'

	if(fs.existsSync(jsonPath)){
		fs.readFile(jsonPath, 'utf8', function readFileCallback(err, existingData){
            if (err){
                console.log(err);
                return []
            } else {
                let obj = JSON.parse(existingData);

                // @ts-ignore
                let errorTexts = obj.map((e:object) => e.errorText)
                // console.log(errorTexts)

                // @ts-ignore
                let promise = fuzzysort.goAsync(errorSearch, obj, {key:'errorText'})
                promise.then(results => {
                    // @ts-ignore
                    let relevantErrorEntries = results.map(r => r.obj)
                    const panel = vscode.window.createWebviewPanel(
                        'errorResults',
                        'Error Results',
                        vscode.ViewColumn.One,
                        {
                            enableScripts: true,
                            retainContextWhenHidden: true
                        }
                    );
                    panel.webview.html = getWebviewContent(relevantErrorEntries);                     
                })
            }
        });
	} else {
		return []
	}
}

function getWebviewContent(errorEntries: Array<Object>) {
    let errors = ""
    errorEntries.forEach(function (errorEntry) {
        errors += "<div>Error logs:</div>"
        errors += "<code>"
        errors += errorEntry.errorText
        errors += "</code>"
        errors += "</br>"

        errors += "<div>Resolution</div>"
        errors += "<p>"
        errors += errorEntry.errorResolution
        errors += "</p>"

        errors += "<div>Relevant file:</div>"
        errors += "<p>"
        errors += errorEntry.errorPath
        errors += "</p>"

        errors += "<div>Reporter email:</div>"
        errors += "<p>"
        errors += errorEntry.reporterEmail
        errors += "</p>"

        errors += "</br>"
    });
    console.log(errors)


    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Erro Results</title>
    </head>
    <body>
        <h1>Error Results</h1>
        <div id="errorResults">${errors}</div>
    </body>
    </html>`;
}