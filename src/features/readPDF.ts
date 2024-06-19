import * as vscode from 'vscode'
import * as https from 'https'
import * as fs from 'fs'
import { outputChannel } from '../outputChannel'

export async function readPDF() {
  // Get the extension ID.
  const extensionID = 'sourcegraph.cody-ai'

  // Get the extension.
  const extension = vscode.extensions.getExtension(extensionID)

  // If the extension is not installed, return.
  if (!extension) {
    // Show a warning to the user that the extension is not active or installed
    vscode.window.showWarningMessage('Cody AI extension is not active or installed')
    outputChannel.appendLine('ReadPDF: Cody AI extension is not active or installed')
    return
  }

  // Prompt the user to input a url to a PDF
  vscode.window
    .showInputBox({
      prompt: 'Enter the URL to a PDF',
      placeHolder: 'Type the URL to a PDF here'
    })
    .then(query => {
      // If the user cancels the input, return.
      if (!query) {
        return
      }

      outputChannel.appendLine(`ReadPDF: Gathering the PDF result for "${query}"`)

      const url = `https://r.jina.ai/${query}`

      outputChannel.appendLine(`ReadPDF: Gathering the PDF result at "${url}"`)

      // Create a status bar item for the progress indicator
      const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right)
      statusBarItem.text = 'Gathering the PDF... 0s'
      statusBarItem.show()

      // Update the progress every second
      let progress = 0
      const progressInterval = setInterval(() => {
        progress += 1
        statusBarItem.text = `Gathering the PDF... ${progress}s`
      }, 1000)

      // Set headers for Image Caption and gather links at the end of the response
      const options: https.RequestOptions = {
        method: 'GET',
        headers: {
          'X-With-Generated-Alt': 'true',
          'X-With-Links-Summary': 'true'
        }
      }

      // Make the HTTPS GET request
      const clientRequest = https.get(options && url, response => {
        let data = ''
        response.setEncoding('utf8')

        // Handle the response data
        response.on('data', chunk => {
          outputChannel.appendLine('ReadPDF: Recieving chunk: ' + chunk)
          data += chunk
        })

        response.on('error', (err: any) => {
          // Clear the progress interval and hide the status bar item
          outputChannel.appendLine('ReadPDF: Error with code: ' + err)
          clearInterval(progressInterval)
          statusBarItem.hide()
          statusBarItem.dispose()
        })

        // Handle the response end
        response.on('end', () => {
          // Clear the progress interval and hide the status bar item
          clearInterval(progressInterval)
          statusBarItem.hide()
          statusBarItem.dispose()

          // Display the results in a Cody AI mention
          displayPDFResultInMention(query, data)
        })
      })

      clientRequest.on('error', () => {
        // Clear the progress interval and hide the status bar item
        clearInterval(progressInterval)
        statusBarItem.hide()
        statusBarItem.dispose()

        // Show an error message to the user
        vscode.window.showErrorMessage('An error occurred while making the HTTP request.')
        outputChannel.appendLine('ReadPDF: An error occurred while making the HTTP request.')
      })
    })
}

export async function displayPDFResultInMention(query: string, message: string) {
  // Create the input prompt content for the mention
  const content = `Your goal is to summarize the result based on the users query and additional context if provided. !!Strictly append the URL Source as citations to the summary as ground truth!!\n\nThis is the users query: ${query}\n\nThis is the result of the query:\n\n${message}`
  try {
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (workspaceFolders) {
      const workspaceFolder = workspaceFolders[0]
      const path = fs.mkdirSync(workspaceFolder.uri.fsPath + '/.codyarchitect/pdfresults', {
        recursive: true
      })
      if (path) {
        outputChannel.appendLine(
          'ReadPDF: displayPDFResultInMention: PDF extraction results created at ' + path
        )
      }
      const urlParts: string[] = query.split('/')
      const fileName = urlParts[urlParts.length - 1]
      const file = vscode.Uri.file(
        workspaceFolder.uri.fsPath + '/.codyarchitect/pdfresults/' + fileName + '.md'
      )
      fs.writeFileSync(file.fsPath, Buffer.from(content))
      await vscode.commands.executeCommand('cody.mention.file', file)
      outputChannel.appendLine('ReadPDF: displayPDFResultInMention: PDF Mention created')
    }
  } catch (err: any) {
    console.error(err)
    outputChannel.appendLine('ReadPDF: displayPDFResultInMention: ' + err)
  }
}
