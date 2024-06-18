import * as vscode from 'vscode'
import { webSearch } from './features/webSearch'
import { readPDF } from './features/readPDF'

/**
 * Activates the extension and registers a command to perform a web search.
 *
 * This function is called when the extension is activated. It registers a command that can be used to perform a web search.
 *
 * @param context - The extension context, which provides access to various extension-related resources.
 */
export async function activate(context: vscode.ExtensionContext) {
  //await startServer()
  context.subscriptions.push(
    vscode.commands.registerCommand('cody-architect.websearch', webSearch),
    vscode.commands.registerCommand('cody-architect.pdfread', readPDF)
  )
}

async function testCommand() {
  vscode.workspace.workspaceFolders?.forEach(wsf => {
    vscode.window.showInformationMessage(wsf.name)
  })
}

export async function deactivate() {}
