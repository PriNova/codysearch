import * as vscode from 'vscode'
import * as fs from 'fs'
import { getEncoding } from 'js-tiktoken'
import { outputChannel } from '../outputChannel'

/**
 * Performs a web search using the Jina AI search engine and displays the results in Cody AI mentions.
 *
 * This function enhances the IDE's capabilities by allowing users to perform web searches without
 * leaving their development environment. It prompts for a search query and an optional URL to narrow
 * results, then fetches and displays the information using Cody AI mentions for seamless integration.
 *
 * @param apiKey - The API key for authenticating with the Jina AI search engine.
 * @returns {Promise<void>} A Promise that resolves when the search is complete or an error occurs.
 */
export async function webSearch(apiKey: string): Promise<void> {
  const extensionID = 'sourcegraph.cody-ai'
  const extension = vscode.extensions.getExtension(extensionID)

  // Cody AI extension is required for displaying search results in mentions
  if (!extension) {
    // Inform the user about the missing dependency to guide them towards resolving the issue
    vscode.window.showWarningMessage('Cody AI extension is not active or installed')
    outputChannel.appendLine('WebSearch: Cody AI extension is not active or installed')
    return
  }

  // Prompt the user to input a search query
  const query = await vscode.window.showInputBox({
    prompt: 'Enter your web search query',
    placeHolder: 'Type your search query here'
  })

  // Respect user's decision to abort the search operation
  if (!query) {
    return
  }

  // Prompt the user to input an URL to narrow down the search results
  const urlSite = await vscode.window.showInputBox({
    prompt: 'Enter a URL to narrow down the search results',
    placeHolder: 'Type your URL here'
  })

  // Encode the query and URL for the API request
  const encodedQuery = encodeURIComponent(query)
  const encodedURLSite = encodeURIComponent(urlSite ? urlSite : '')
  const url = `https://s.jina.ai/${encodedQuery}?site=${encodedURLSite}`

  outputChannel.appendLine(`WebSearch: Gathering the web result at "${url}"`)

  // Provide visual feedback to the user during potentially long-running web search operations
  // This improves user experience by keeping them informed about the ongoing process
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right)
  statusBarItem.text = 'Gathering the web result... 0s'
  statusBarItem.show()

  // Provide real-time feedback to enhance user experience during potentially long-running operations
  let progress = 0
  const updateProgress = () => {
    progress += 1
    statusBarItem.text = `Gathering the web result... ${progress}s`
  }
  const progressInterval = setInterval(updateProgress, 1000)

  // Configure request headers to enhance search results with additional features and ensure fresh data
  const headers = {
    'X-With-Generated-Alt': 'true',
    'X-With-Links-Summary': 'true',
    'X-No-Cache': 'true',
    ...(apiKey?.trim() && { authorization: `Bearer ${apiKey}` })
  }

  // Log request headers for debugging and transparency, aiding in troubleshooting API interactions
  outputChannel.appendLine('WebSearch: Request headers:')
  Object.entries(headers).forEach(([key, value]) => {
    if (key !== 'authorization') {
      outputChannel.appendLine(`  ${key}: ${value}`)
    }
  })

  const options = {
    method: 'GET',
    headers,
    timeout: 60000,
    encodedQuery: 'utf8'
  }

  // Initiate the web search request and handle potential network or API errors
  try {
    const response: Response = await fetch(url, options)
    const data = await response.text()

    if (!data) {
      // Handle the error
      const errorMessage = `Error fetching result}`
      vscode.window.showErrorMessage(errorMessage)
      outputChannel.appendLine(errorMessage)

      // Clean up UI elements to maintain a clutter-free interface after search completion
      clearInterval(progressInterval)
      statusBarItem.hide()
      statusBarItem.dispose()
    } else {
      // Process the API response to prepare search results for display and logging
      const results = data
      outputChannel.appendLine(`WebSearch: Found results`)

      // Clean up UI elements to maintain a clutter-free interface after search completion
      clearInterval(progressInterval)
      statusBarItem.hide()
      statusBarItem.dispose()

      await displaySearchResultsInMention(query, results)
    }
  } catch (error) {
    clearInterval(progressInterval)
    statusBarItem.hide()
    statusBarItem.dispose()
    outputChannel.append('WebSearch: Error with code: ' + error)
  }
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

  // Use the tiktoken library for counting the number of token in the 'prefix' string
  const enc = getEncoding('cl100k_base')

  // Reduce the 'prefix' string until the tokens are lesser than 28000 tokens.
  let truncatedWebResult = prefix
  while (true) {
    const encoded = enc.encode(truncatedWebResult, 'all')
    if (encoded.length <= 28000) {
      break
    }
    // Reduce by approximately 10% each iteration
    const newLength = Math.floor(truncatedWebResult.length * 0.9)
    truncatedWebResult = truncatedWebResult.slice(0, newLength)
  }

  outputChannel.appendLine(
    `WebSearch: Truncated prefix to ${enc.encode(truncatedWebResult, 'all').length} tokens to avoid exceeding the mention limit`
  )

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

function truncateToTokenLimit(text: string, tokenLimit: number): string {
  const enc = new TextEncoder()
  let currentText = text

  while (true) {
    const encoded = enc.encode(currentText)
    if (encoded.length <= tokenLimit) {
      return currentText
    }
    // Reduce by approximately 10% each iteration
    const newLength = Math.floor(currentText.length * 0.9)
    currentText = currentText.slice(0, newLength)
  }
}
