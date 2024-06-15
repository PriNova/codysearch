import * as vscode from 'vscode'
import * as https from 'https'
import tmp from 'tmp'
import * as fs from 'fs'

export async function readPDF() {
  // Get the extension ID.
  const extensionID = 'sourcegraph.cody-ai'

  // Get the extension.
  const extension = vscode.extensions.getExtension(extensionID)

  // If the extension is not installed, return.
  if (!extension) {
    // Show a warning to the user that the extension is not active or installed
    vscode.window.showWarningMessage('Cody AI extension is not active or installed')
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
          'X-With-Links-Summary': 'true'
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
      })
    })
}

export async function displayPDFResultInMention(query: string, message: string) {
  // Create the input prompt content for the mention
  const content = `Your goal is to summarize the result based on the users query and additional context if provided. !!Strictly append the URL Source as citations to the summary as ground truth!!\n\nThis is the users query:${query}\n\nThis is the result of the query:${message}`
  try {
    // Create a temporary file to hold the content
    const tmpFile = tmp.fileSync({ postfix: '.txt' })
    const tmpFileUri = vscode.Uri.file(tmpFile.name)

    // Write the content to the temporary file
    fs.writeFileSync(tmpFile.name, content)
    await vscode.commands.executeCommand('cody.mention.file', tmpFileUri)

    // Cleanup the temporary file
    tmpFile.removeCallback()
  } catch (err) {
    console.error(err)
  }
}
