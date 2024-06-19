import * as vscode from 'vscode'
import * as https from 'https'
import * as tmp from 'tmp'
import * as fs from 'fs'
import { outputChannel } from '../outputChannel'

/**
 * Performs a web search using the Jina AI search engine and displays the results in a Cody AI mention.
 *
 * This function prompts the user to enter a search query, then makes an HTTPS GET request to the Jina AI search engine with the encoded query. The response data is then passed to the `appendToChat` function, which creates a temporary file with the query and result, and opens the file in a Cody AI mention.
 *
 * @returns {Promise<void>} A Promise that resolves when the search is complete or an error occurs.
 */
export async function webSearch(): Promise<void> {
  // Get the extension ID.
  const extensionID = 'sourcegraph.cody-ai'

  // Get the extension.
  const extension = vscode.extensions.getExtension(extensionID)

  // If the extension is not installed, return.
  if (!extension) {
    // Show a warning to the user that the extension is not active or installed
    vscode.window.showWarningMessage('Cody AI extension is not active or installed')
    outputChannel.appendLine('WebSearch: Cody AI extension is not active or installed')
    return
  }

  // Prompt the user to input a search query
  vscode.window
    .showInputBox({
      prompt: 'Enter your web search query',
      placeHolder: 'Type your search query here'
    })
    .then(query => {
      // If the user cancels the input, return.
      if (!query) {
        return
      }

      outputChannel.appendLine(`WebSearch: Gathering the web result for "${query}"`)
      // Encode the query
      const encodedQuery = encodeURIComponent(query)
      const url = `https://s.jina.ai/${encodedQuery}`

      outputChannel.appendLine(`WebSearch: Gathering the web result at "${url}"`)

      // Create a status bar item for the progress indicator
      const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right)
      statusBarItem.text = 'Gathering the web result... 0s'
      statusBarItem.show()

      // Update the progress every second
      let progress = 0
      const updateProgress = () => {
        progress += 1
        statusBarItem.text = `Gathering the web result... ${progress}s`
      }
      const progressInterval = setInterval(updateProgress, 1000)

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
          outputChannel.appendLine('WebSearch: Recieving chunk: ' + chunk)
          data += chunk
        })

        response.on('error', (err: any) => {
          // Clear the progress interval and hide the status bar item
          outputChannel.appendLine('WebSearch: Error with code: ' + err)
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
          displaySearchResultsInMention(query, data)
        })
      })

      clientRequest.on('error', () => {
        // Clear the progress interval and hide the status bar item
        clearInterval(progressInterval)
        statusBarItem.hide()
        statusBarItem.dispose()

        // Show an error message to the user
        vscode.window.showErrorMessage('An error occurred while making the HTTP request.')
        outputChannel.appendLine('WebSearch: An error occurred while making the HTTP request.')
      })
    })
}

/**
 * Appends a summary of the web search query and result to .codyarchitect folder for later referencing, and opens the file in a Cody AI mention.
 *
 * @param query - The original search query entered by the user.
 * @param message - The result of the web search.
 */
export async function displaySearchResultsInMention(query: string, message: string) {
  // Create the input prompt content for the mention
  const content = `Your goal is to summarize the result based on the users query and additional context if provided. !!Strictly append the URL Source as citations to the summary as ground truth!!\n\nThis is the users query: ${query}\n\nThis is the result of the query:\n\n${message}`
  try {
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (workspaceFolders) {
      const workspaceFolder = workspaceFolders[0]
      const path = fs.mkdirSync(workspaceFolder.uri.fsPath + '/.codyarchitect/webresults', {
        recursive: true
      })
      if (path) {
        outputChannel.appendLine(
          'WebSearch: displaySearchResultsInMention: Path for Web search results created at ' + path
        )
      }
      const file = vscode.Uri.file(
        workspaceFolder.uri.fsPath + '/.codyarchitect/webresults/' + query + '.md'
      )
      fs.writeFileSync(file.fsPath, Buffer.from(content))
      await vscode.commands.executeCommand('cody.mention.file', file)
      outputChannel.appendLine(
        'WebSearch: displaySearchResultsInMention: Web search results created'
      )
    }
  } catch (err: any) {
    console.error(err)
    outputChannel.appendLine('WebSearch: displaySearchResultsInMention: ' + err)
  }
}
