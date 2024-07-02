import * as vscode from 'vscode'
import { Frame, Node } from './NodeEditorApp'

/**
 * Opens a webview panel for a Node Editor UI.
 *
 * The function creates a new webview panel, sets its HTML content using the `getWebviewContent` function, and listens for messages from the webview to handle frame creation and deletion.
 *
 * @param context - The extension context, used to resolve the path to the webview script.
 */
export function createNodeEditorPanel(context: vscode.ExtensionContext) {
  const panel = vscode.window.createWebviewPanel(
    'nodeEditor',
    'Node Editor',
    vscode.ViewColumn.One,
    {
      enableScripts: true
    }
  )

  panel.webview.html = getWebviewContent(panel, context)

  // Listen for messages from the webview
  panel.webview.onDidReceiveMessage(
    message => {
      switch (message.type) {
        case 'frame':
          if (message.action === 'create') {
            createFrame(message.frame)
          } else if (message.action === 'delete') {
            deleteFrame(message.id)
          }
          break
        case 'node':
          if (message.action === 'create') {
            createNode(message.node)
          } else if (message.action === 'delete') {
            deleteNode(message.id)
          }
          break
      }
    },
    undefined,
    context.subscriptions
  )

  // Handle frame creation
  function createFrame(frame: Frame) {
    vscode.window.showInformationMessage(`Created frame: ${frame.name} at ${frame.path}`)
  }

  // Handle frame deletion
  function deleteFrame(id: string) {
    vscode.window.showInformationMessage(`Deleted frame with id: ${id}`)
  }

  // Handle node creation
  function createNode(node: Node) {
    vscode.window.showInformationMessage(`Created node: ${node.name} in frame: ${node.frameId}`)
  }

  // Handle node deletion
  function deleteNode(id: string) {
    vscode.window.showInformationMessage(`Deleted node with id: ${id}`)
  }
}

/**
 * Generates the HTML content for the webview panel used in the Node Editor.
 *
 * @param panel - The webview panel instance.
 * @param context - The extension context.
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
