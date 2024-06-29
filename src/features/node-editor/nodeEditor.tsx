import * as vscode from 'vscode'

interface Frame {
  id: string
  name: string
  path: string
}

export function openNodeEditor(context: vscode.ExtensionContext) {
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

  function createFrame(frame: Frame) {
    frames.push(frame)
    updateWebview()
    vscode.window.showInformationMessage(`Created frame: ${frame.name} at ${frame.path}`)
  }

  function deleteFrame(id: string) {
    frames = frames.filter(frame => frame.id !== id)
    updateWebview()
    vscode.window.showInformationMessage(`Deleted frame with id: ${id}`)
  }

  function updateWebview() {
    panel.webview.postMessage({ type: 'updateFrames', frames })
  }
}

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
