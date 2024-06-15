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
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('cody-architect.websearch', webSearch),
    vscode.commands.registerCommand('cody-architect.pdfread', readPDF)
  )
  //const disposable = vscode.commands.registerCommand('cody-architect.websearch', webSearch)
  //context.subscriptions.push(disposable)
}

export function deactivate() {}
