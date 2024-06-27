import * as vscode from 'vscode'
import { webSearch } from './features/webSearch'
import { readPDF } from './features/readPDF'
import { outputChannel } from './outputChannel'
import { startServer, stopServer } from './features/server'
import { openNodeEditor } from './features/node-editor/nodeEditor'

/**
 * Activates the extension and registers a command to perform a web search.
 *
 * This function is called when the extension is activated. It registers a command that can be used to perform a web search.
 *
 * @param context - The extension context, which provides access to various extension-related resources.
 */
export async function activate(context: vscode.ExtensionContext) {
  //await startServer()
  outputChannel.show()
  outputChannel.appendLine('Activate: Cody Architect extension is active')
  context.subscriptions.push(
    vscode.commands.registerCommand('cody-architect.websearch', webSearch),
    vscode.commands.registerCommand('cody-architect.pdfread', readPDF),
    vscode.commands.registerCommand('cody-architect.openNodeEditor', () => openNodeEditor(context))
  )
}

async function testCommand() {
  vscode.workspace.workspaceFolders?.forEach(wsf => {
    vscode.window.showInformationMessage(wsf.name)
  })
}

export async function deactivate() {
  //await stopServer()
  outputChannel.dispose()
}
