import * as vscode from 'vscode';
import * as https from 'https';
import * as tmp from 'tmp';
import * as fs from 'fs';

/**
 * Performs a web search using the Jina AI search API and displays the result in a Cody AI mention.
 *
 * This function prompts the user to enter a search query, encodes the query, makes an HTTPS GET request to the Jina AI search API, and then appends a summary of the query and result to a temporary file. The temporary file is then opened in a Cody AI mention.
 *
 * @param {string} query - The search query entered by the user.
 * @returns {Promise<void>} - A Promise that resolves when the search result has been displayed in a Cody AI mention.
 */
export async function webSearch() {

    // Get the extension ID.
    const extensionID = 'sourcegraph.cody-ai';

    // Get the extension.
    const extension = vscode.extensions.getExtension(extensionID);

    // If the extension is not installed, return.
    if (!extension) {
        // Show a warning to the user that the extension is not active or installed
        vscode.window.showWarningMessage('Cody AI extension is not active or installed');
        return;
    }

    // Prompt the user to input a search query
    vscode.window.showInputBox({
        prompt: 'Enter your web search query',
        placeHolder: 'Type your search query here',
    }).then(query => {

        // If the user cancels the input, return.
        if (!query) {
            return;
        }
        const encodedQuery = encodeURIComponent(query);

        // Make a https GET request to the provided address and wait for the content
        const url = `https://s.jina.ai/${encodedQuery}`;

        https.get(url, (response) => {
            let data = '';
            response.setEncoding('utf8');

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                // Show the data in a new webview
                appendToChat(query, data);
            });
        }).on('error', (e) => {
            vscode.window.showErrorMessage('An error occurred while making the HTTP request.');
        });
    });
}

/**
 * Appends a summary of the web search query and result to a temporary file, and opens the file in a Cody AI mention.
 *
 * @param query - The original search query entered by the user.
 * @param message - The result of the web search.
 */
async function appendToChat(query: string, message: string) {

    // create a temporary in-memory file with the content of 'message' in the project root directory to be called with the vscode.URL for the 'cody.mention.file' command
    const content = `Your goal is to summarize the result based on the users query.\nThis is the users query:${query}\n\nThis is the result of the query:${message}`;
    try {
        const path = vscode.Uri.file('/tmp');
        const file = vscode.Uri.joinPath(path, 'query.txt');

        const tmpFile = tmp.fileSync({ postfix: '.txt' });
        const tmpFileUri = vscode.Uri.file(tmpFile.name);

        fs.writeFileSync(tmpFile.name, content);
        await vscode.commands.executeCommand('cody.mention.file', tmpFileUri);

        // Cleanup the temporary file
        tmpFile.removeCallback();
    }
    catch (err) {
        console.error(err);
    }

}