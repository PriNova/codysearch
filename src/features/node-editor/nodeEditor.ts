import * as vscode from 'vscode';

export function openNodeEditor(context: vscode.ExtensionContext) {
  const panel = vscode.window.createWebviewPanel(
    'nodeEditor',
    'Node Editor',
    vscode.ViewColumn.One,
    {
      enableScripts: true
    }
  );

  panel.webview.html = getWebviewContent();
}

function getWebviewContent() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Node Editor</title>
    </head>
    <body>
        <h1>Node Editor</h1>
        <p>Hello World from the Node Editor!</p>
    </body>
    </html>
  `;
}
