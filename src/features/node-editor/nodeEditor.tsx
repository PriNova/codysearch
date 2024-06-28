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

  panel.webview.html = getWebviewContent(panel, context);

  // Handle messages from the webview
  panel.webview.onDidReceiveMessage(
    message => {
      switch (message.command) {
        case 'alert':
          vscode.window.showErrorMessage(message.text);
          return;
      }
    },
    undefined,
    context.subscriptions
  );
}

function getWebviewContent(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
  let scriptSrc = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, "dist", "webview", "index.js"))
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Node Editor</title>
    </head>
    <body>
        <div id="root"></div>
        <script src="${scriptSrc}"></script>
    </body>
    </html>
  `;
}
