import * as vscode from 'vscode'
import * as https from 'https'
import * as fs from 'fs'
import { outputChannel } from '../outputChannel'

export async function readPDF(apiKey: string) {
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

      const url = `https://r.jina.ai/${query}`

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
          'X-With-Links-Summary': 'true',
          ...(apiKey?.trim() && { authorization: `Bearer ${apiKey}` })
        }
      }

      // Make the HTTPS GET request
      const clientRequest = https.get(options && url, response => {
        let data = ''
        response.setEncoding('utf8')

        // Handle the response data
        response.on('data', chunk => {
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

          // Try to parse the data as JSON
          try {
            const jsonData = JSON.parse(data)

            // Check if it's an error response
            if (jsonData.code && jsonData.message) {
              // Handle the error
              const errorMessage = `Error ${jsonData.code}: ${jsonData.message}`
              vscode.window.showErrorMessage(`Jina API: ${errorMessage}`)
              outputChannel.appendLine(`Jina API: ${errorMessage}`)
            } else {
              // It's a valid JSON response, but not an error
              // You might want to handle this case differently
              displayPDFResultInMention(query, JSON.stringify(jsonData, null, 2))
            }
          } catch (e) {
            // If it's not valid JSON, treat it as a regular string response
            displayPDFResultInMention(query, data)
          }

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

export async function displayPDFResultInMention(query: string, PDF: string) {
  // Create the input prompt prefix for the mention
  const prefix = `Your goal is to provide a concise and specific answer based on the content of the provided PDF. Do not make up content or code not included in the results. It is essential sticking to the results. !!Strictly append the URL Source as citations to the summary as ground truth!!\n\nThis is the result of the PDF:\n\n${PDF}`

  // Truncate the prefix to 80000 characters or less
  const truncatedWebResult = prefix.slice(0, 80000)

  try {
    // Get the workspace folders
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (workspaceFolders) {
      // Get the first workspace folder
      const workspaceFolder = workspaceFolders[0]

      // Create a directory for PDF results
      const path = fs.mkdirSync(workspaceFolder.uri.fsPath + '/.codyarchitect/pdfresults', {
        recursive: true
      })
      if (path) {
        outputChannel.appendLine(
          'ReadPDF: displayPDFResultInMention: PDF extraction results created at ' + path
        )
      }

      // Extract the file name from the query
      const urlParts: string[] = query.split('/')
      const fileName = urlParts[urlParts.length - 1]

      // Create a file URI for the PDF result
      const file = vscode.Uri.file(
        workspaceFolder.uri.fsPath + '/.codyarchitect/pdfresults/' + fileName + '.md'
      )

      // Write the truncated web result to the file
      fs.writeFileSync(file.fsPath, Buffer.from(truncatedWebResult))

      // Execute the command to mention the file
      await vscode.commands.executeCommand('cody.mention.file', file)
    }
  } catch (err: any) {
    // Log any errors that occur
    console.error(err)
    outputChannel.appendLine('ReadPDF: displayPDFResultInMention: ' + err)
  }
}
