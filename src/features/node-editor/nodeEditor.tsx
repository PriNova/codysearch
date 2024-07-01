import * as vscode from 'vscode'

/**
 * Represents a frame in the Node Editor UI.
 *
 * A frame has an unique identifier (`id`), a display name (`name`), and a file path (`path`).
 */
interface Frame {
  id: string
  name: string
  path: string
}

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

  let frames: Frame[] = []

  panel.webview.html = getWebviewContent(panel, context)

  // Listen for messages from the webview
  panel.webview.onDidReceiveMessage(
    message => {
      switch (message.command) {
        case 'createFrame':
          createFrame(message.frame)
          break
        case 'deleteFrame':
          deleteFrame(message.id)
          break
      }
    },
    undefined,
    context.subscriptions
  )

  // Handle frame creation
  function createFrame(frame: Frame) {
    frames.push(frame)
    updateWebview()
    vscode.window.showInformationMessage(`Created frame: ${frame.name} at ${frame.path}`)
  }

  // Handle frame deletion
  function deleteFrame(id: string) {
    frames = frames.filter(frame => frame.id !== id)
    updateWebview()
    vscode.window.showInformationMessage(`Deleted frame with id: ${id}`)
  }

  // Update the webview with the latest frames
  function updateWebview() {
    panel.webview.postMessage({ type: 'updateFrames', frames })
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
