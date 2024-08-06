import * as vscode from 'vscode'
import { webSearch } from './features/webSearch'
import { readPDF } from './features/readPDF'
import { outputChannel } from './outputChannel'
import { startServer, stopServer } from './features/server'
import { createNodeEditorPanel as createNodeEditorPanel } from './features/node-editor/nodeEditor'

/**
 * Activates the extension and registers a command to perform a web search.
 *
 * This function is called when the extension is activated. It registers a command that can be used to perform a web search.
 *
 * @param context - The extension context, which provides access to various extension-related resources.
 */
export async function activate(context: vscode.ExtensionContext) {
  //const config = vscode.workspace.getConfiguration('codyArchitect')
  function getCurrentApiKey(): string {
    return vscode.workspace.getConfiguration('codyArchitect').get('jinaApiKey') as string
  }

  //await startServer()
  outputChannel.show()
  outputChannel.appendLine('Activate: Cody Architect extension is active')
  context.subscriptions.push(
    vscode.commands.registerCommand('cody-architect.websearch', () =>
      webSearch(getCurrentApiKey())
    ),
    vscode.commands.registerCommand('cody-architect.pdfread', () => readPDF(getCurrentApiKey()))
  )

  // Add a command to set the API key
  context.subscriptions.push(
    vscode.commands.registerCommand('cody-architect.setJinaApiKey', async () => {
      const newApiKey = await vscode.window.showInputBox({
        prompt: 'Enter your Jina AI API key (leave empty to clear)',
        password: true,
        value: getCurrentApiKey()
      })

      if (newApiKey !== undefined) {
        if (newApiKey === '') {
          const confirmation = await vscode.window.showWarningMessage(
            'Are you sure you want to clear the API key?',
            'Yes',
            'No'
          )
          if (confirmation === 'Yes') {
            await vscode.workspace
              .getConfiguration('codyArchitect')
              .update('jinaApiKey', '', vscode.ConfigurationTarget.Global)
            vscode.window.showInformationMessage('Jina AI API key cleared successfully')
          }
        } else {
          await vscode.workspace
            .getConfiguration('codyArchitect')
            .update('jinaApiKey', newApiKey, vscode.ConfigurationTarget.Global)
          vscode.window.showInformationMessage('Jina AI API key updated successfully')
        }
      }
    })
    vscode.commands.registerCommand('cody-architect.createNodeEditorPanel', () =>
      createNodeEditorPanel(context)
    )
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
