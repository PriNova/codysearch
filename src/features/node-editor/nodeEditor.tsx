import * as vscode from 'vscode'

/**
 * Opens a webview panel for a Node Editor UI.
 *
 * The webview panel is created with the 'nodeEditor' identifier and 'Node Editor' title, and is displayed in the first view column.
 * The webview is enabled to execute scripts, and its HTML content is generated using the `getWebviewContent` function.
 *
 * The webview panel also handles messages received from the webview, and currently only supports the 'alert' command, which displays an error message.
 *
 * @param context The current extension context.
 */
export function openNodeEditor(context: vscode.ExtensionContext) {
  const panel = vscode.window.createWebviewPanel(
    'nodeEditor',
    'Node Editor',
    vscode.ViewColumn.One,
    {
      enableScripts: true
    }
  )

  // Set the webview's initial HTML content
  panel.webview.html = getWebviewContent(panel, context)

  // Handle messages from the webview
  panel.webview.onDidReceiveMessage(
    message => {
      switch (message.command) {
        case 'alert':
          vscode.window.showErrorMessage(message.text)
          return
      }
    },
    undefined,
    context.subscriptions
  )
}

/**
 * Generates the HTML content for the Node Editor webview panel.
 *
 * The function takes the current webview panel and the extension context as parameters.
 * It constructs the HTML content for the webview, including a root div element and a script tag that loads the webview's JavaScript code.
 * The script source is obtained by converting the relative path to the webview's JavaScript file into a webview URI.
 *
 * @param panel The current webview panel.
 * @param context The current extension context.
 * @returns The HTML content for the webview panel.
 */
function getWebviewContent(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
  let scriptSrc = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(
      context.extensionUri,
      'dist/features/node-editor',
      'webview',
      'NodeEditorApp.js'
    )
  )
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
  `
}
