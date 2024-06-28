import * as vscode from 'vscode';
import NodeEditorApp from './NodeEditorApp';

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

function getWebviewContent() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Node Editor</title>
        <script src="https://unpkg.com/react@17/umd/react.production.min.js"></script>
        <script src="https://unpkg.com/react-dom@17/umd/react-dom.production.min.js"></script>
    </head>
    <body>
        <div id="root"></div>
        <script>
          const e = React.createElement;
          function NodeEditorApp() {
            return e('div', null, [
              e('h1', null, 'Node Editor'),
              e('p', null, 'This is a React-based Node Editor!')
            ]);
          }
          ReactDOM.render(e(NodeEditorApp), document.getElementById('root'));
        </script>
    </body>
    </html>
  `;
}
