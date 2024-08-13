import * as vscode from 'vscode'
import * as fs from 'fs'
import { getEncoding } from 'js-tiktoken'
import { outputChannel } from '../outputChannel'

export async function readPDF(apiKey: string) {
  const extensionID = 'sourcegraph.cody-ai'
  const extension = vscode.extensions.getExtension(extensionID)

  // Cody AI extension is required for displaying search results in mentions
  if (!extension) {
    // Inform the user about the missing dependency to guide them towards resolving the issue
    vscode.window.showWarningMessage('Cody AI extension is not active or installed')
    outputChannel.appendLine('ReadPDF: Cody AI extension is not active or installed')
    return
  }

  // Prompt the user to input a url to a PDF
  const query = await vscode.window.showInputBox({
    prompt: 'Enter the URL to a PDF',
    placeHolder: 'Type the URL to a PDF here'
  })

  // Respect user's decision to abort the search operation
  if (!query) {
    return
  }

  const url = `https://r.jina.ai/${query}`

  // Provide visual feedback to the user during potentially long-running web search operations
  // This improves user experience by keeping them informed about the ongoing process
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right)
  statusBarItem.text = 'Gathering the PDF... 0s'
  statusBarItem.show()

  // Provide real-time feedback to enhance user experience during potentially long-running operations
  let progress = 0
  const updateProgress = () => {
    progress += 1
    statusBarItem.text = `Gathering the PDF result... ${progress}s`
  }
  const progressInterval = setInterval(updateProgress, 1000)

  // Configure request headers to enhance search results with additional features and ensure fresh data
  const options = {
    method: 'GET',
    headers: {
      'X-With-Generated-Alt': 'true',
      'X-With-Links-Summary': 'true',
      'X-No-Cache': 'true',
      ...(apiKey?.trim() && { authorization: `Bearer ${apiKey}` })
    }
  }

  // Initiate the PDF fetch request and handle potential network or API errors
  try {
    const response = await fetch(url, options)
    const data = await response.text()

    //response.setEncoding('utf8')
    if (!data) {
      // Handle the error
      const errorMessage = `Error fetching result}`
      vscode.window.showErrorMessage(errorMessage)
      outputChannel.appendLine(errorMessage)
    } else {
      // Process the API response to prepare PDF fetch results for display and logging
      outputChannel.appendLine(`readPDF: PDF fetched`)
      displayPDFResultInMention(query, data)
    }
  } catch (error) {
    // Clear the progress interval and hide the status bar item
    clearInterval(progressInterval)
    statusBarItem.hide()
    statusBarItem.dispose()
  }
}

export async function displayPDFResultInMention(query: string, PDF: string) {
  // Create the input prompt prefix for the mention
  const prefix = `Your goal is to provide a concise and specific answer based on the content of the provided PDF. Do not make up content or code not included in the results. It is essential sticking to the results. !!Strictly append the URL Source as citations to the summary as ground truth!!\n\nThis is the result of the PDF:\n\n${PDF}`

  // Use the tiktoken library for counting the number of token in the 'prefix' string
  const enc = getEncoding('cl100k_base')

  // Reduce the 'prefix' string until the tokens are lesser than 28000 tokens.
  let truncatedPDFResult = prefix
  while (true) {
    const encoded = enc.encode(truncatedPDFResult, 'all')
    if (encoded.length <= 28000) {
      break
    }
    // Reduce by approximately 10% each iteration
    const newLength = Math.floor(truncatedPDFResult.length * 0.9)
    truncatedPDFResult = truncatedPDFResult.slice(0, newLength)
  }

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
      fs.writeFileSync(file.fsPath, Buffer.from(truncatedPDFResult))

      // Execute the command to mention the file
      await vscode.commands.executeCommand('cody.mention.file', file)
    }
  } catch (err: any) {
    // Log any errors that occur
    console.error(err)
    outputChannel.appendLine('ReadPDF: displayPDFResultInMention: ' + err)
  }
}
