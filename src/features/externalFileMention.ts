import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import { outputChannel } from '../outputChannel'

/**
 * Allows the user to select an external file and mention it in the workspace.
 * If the file is outside the workspace, it's temporarily copied into the workspace.
 *
 * @returns {Promise<void>}
 */
export async function selectExternalFile(): Promise<void> {
  let tempFile: string | undefined

  try {
    const selection = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      openLabel: 'Select File for Mention'
    })

    if (!selection || selection.length === 0) {
      return
    }

    const selectedUri = selection[0]
    const workspaceFolders = vscode.workspace.workspaceFolders

    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error('No workspace folder found')
    }

    const isOutsideWorkspace = !workspaceFolders.some(folder =>
      selectedUri.fsPath.startsWith(folder.uri.fsPath)
    )

    if (isOutsideWorkspace) {
      const tempDir = path.join(workspaceFolders[0].uri.fsPath, '.codyarchitect', 'temp')
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
      }

      tempFile = path.join(tempDir, path.basename(selectedUri.fsPath))
      await vscode.workspace.fs.copy(selectedUri, vscode.Uri.file(tempFile), { overwrite: true })
      await vscode.commands.executeCommand('cody.mention.file', vscode.Uri.file(tempFile))
      outputChannel.appendLine(`External file mentioned: ${selectedUri.fsPath}`)
    } else {
      await vscode.commands.executeCommand('cody.mention.file', selectedUri)
      outputChannel.appendLine(`Workspace file mentioned: ${selectedUri.fsPath}`)
    }
  } catch (error) {
    outputChannel.appendLine(`Error in selectExternalFile: ${error}`)
    vscode.window.showErrorMessage('Failed to select and mention the external file.')
  } finally {
    if (tempFile) {
      await cleanupTempFile(tempFile)
    }
  }
}

/**
 * Cleans up the temporary file created for mentioning external files.
 *
 * @param {string} tempFile - The path to the temporary file to be deleted.
 * @returns {Promise<void>}
 */
async function cleanupTempFile(tempFile: string): Promise<void> {
  try {
    await vscode.workspace.fs.delete(vscode.Uri.file(tempFile))
    outputChannel.appendLine(`Temporary file deleted: ${tempFile}`)
  } catch (deleteError) {
    outputChannel.appendLine(`Failed to delete temporary file: ${deleteError}`)
  }
}
