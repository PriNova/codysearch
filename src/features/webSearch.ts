import * as vscode from 'vscode'
import * as https from 'https'
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
      const clientRequest = https.get(url, options, response => {
        let data = ''
        response.setEncoding('utf8')

        // Handle the response data
        response.on('data', chunk => {
          //outputChannel.appendLine('WebSearch: Recieving chunk: ' + chunk)
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
  // Create the input prompt prefix for the mention
  const prefix = `Your goal is to provide the results based on the users query in a understandable and concise manner. Do not make up content or code not included in the results. It is essential sticking to the results. !!Strictly append the URL Source as citations to the summary as ground truth!!\n\nThis is the users query: ${query}\n\nThese are the results of the query:\n\n${message}`
  
  // Truncate the web result to 80,000 characters to avoid exceeding the mention limit
  const truncatedWebResult = prefix.slice(0, 80000)

  try {
    // Get the workspace folders
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (workspaceFolders) {
      // Get the first workspace folder
      const workspaceFolder = workspaceFolders[0]
      // Create a directory for web search results
      const path = fs.mkdirSync(workspaceFolder.uri.fsPath + '/.codyarchitect/webresults', {
        recursive: true
      })
      if (path) {
        // Log the creation of the directory
        outputChannel.appendLine(
          'WebSearch: displaySearchResultsInMention: Path for Web search results created at ' + path
        )
      }
      // Create a file URI for the search results
      const file = vscode.Uri.file(
        workspaceFolder.uri.fsPath + '/.codyarchitect/webresults/' + query + '.md'
      )
      // Write the truncated web result to the file
      fs.writeFileSync(file.fsPath, Buffer.from(truncatedWebResult))
      // Execute the command to mention the file
      await vscode.commands.executeCommand('cody.mention.file', file)
      // Log the creation of the web search results
      outputChannel.appendLine(
        'WebSearch: displaySearchResultsInMention: Web search results created'
      )
    }
  } catch (err: any) {
    // Log any errors that occur
    console.error(err)
    outputChannel.appendLine('WebSearch: displaySearchResultsInMention: ' + err)
  }
}
