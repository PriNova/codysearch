import * as http from 'http'
import { outputChannel } from '../outputChannel'
import type {
  AnnotationsResult,
  Item,
  ItemsParams,
  ItemsResult,
  MentionsParams,
  MentionsResult,
  MetaParams,
  MetaResult,
  Provider,
  ProviderSettings
} from '@openctx/client'
import * as vscode from 'vscode'
import * as https from 'https'
import { title } from 'process'

// initialize a http server at port 1234
const server = http.createServer()

const docProvider: Provider & { providerUri: 'http://localhost:1234' } = {
  providerUri: 'http://localhost:1234',
  async meta(): Promise<MetaResult> {
    //outputChannel.appendLine('Server: Provider: Meta: ')
    return {
      // empty since we don't provide any annotations.
      name: 'WebSearch',
      mentions: {
        label: 'Type your search query'
      }
    }
  },
  async mentions({ query }): Promise<MentionsResult> {
    //outputChannel.appendLine('Server: Mentions')
    return [
      {
        title: 'query',
        uri: query?.toString() ?? ''
      }
    ]
  },

  async items(params) {
    //outputChannel.appendLine('Server: Items')
    return await fetchItem(params)
  }
}

async function fetchItem(params: ItemsParams, timeout = 2000) {
  return [
    {
      title: 'The title of the item',
      url: 'https://www.example.com'
    }
  ]
}

export async function startServer() {
  server.listen(1234, async () => {
    outputChannel.appendLine('Server: StartServer: Server is listening on port 1234')
  })
  server.on('request', async (req: http.IncomingMessage, res: http.ServerResponse) => {
    //outputChannel.appendLine('Server: StartServer: Received a request header: ' + JSON.stringify(req.headers))
    //const provider = new OpenCtxProvider()
    if (req.method === 'POST') {
      let body = ''
      req.on('data', chunk => {
        body += chunk.toString()
      })
      req.on('end', async () => {
        const request = JSON.parse(body)
        //outputChannel.appendLine('Server: StartServer: Received a request body' + JSON.stringify(request))
        let result
        switch (request.method) {
          case 'meta':
            const metaResult: MetaResult = {
              name: 'WebSearch',
              mentions: {
                label: 'Type your search query'
              }
            }
            result = metaResult //await docProvider.meta(request.params, {})
            //outputChannel.appendLine('Server: StartServer: Sending a meta response' + JSON.stringify(docProvider.meta({}, {})))
            break
          case 'mentions':
            const mentionItem: ItemsResult = [
              {
                title: request.params.query,
                ui: { hover: { text: 'WebSearch 1' } },
                ai: { content: 'A web serch by the user' }
              }
            ]
            result = mentionItem
            //outputChannel.appendLine('Server: StartServer: Sending a mentions response' + JSON.stringify(result))
            break
          case 'items':
            const queryMessage = request.params.message
            const webResult = await fetchWebResult(queryMessage)
            console.log('Length of the WebResult: ' + webResult.length)
            // Prefix the webResult with a custom string
            const prefix = `Your goal is to provide the results based on the users query in a understandable and concise manner. Do not make up content or code not included in the results. It is essential sticking to the results. !!Strictly append the URL Source as citations to the summary as ground truth!!\n\nThis is the users query: ${queryMessage}\n\nThese are the results of the query:\n\n${webResult}`
            //const splitResults = splitIntoFiveParts(webResult)
            // Truncate the content of the webResult to maximum 14000 characters
            const truncatedWebResult = prefix.slice(0, 30000)
            const items: ItemsResult = [
              {
                title: `${request.params.query}`,
                ui: { hover: { text: 'WebSearch' } },
                ai: { content: truncatedWebResult }
              }
            ]
            outputChannel.appendLine(
              'Server: StartServer: Sending a items response' + JSON.stringify(items)
            )
            result = items
            break
          default:
            res.writeHead(400)
            res.end(JSON.stringify({ error: 'Invalid method' }))
            outputChannel.appendLine('Server: StartServer: Bad request method')
            return
        }
        res.writeHead(200, { 'Content-Type': 'application/json' })
        //outputChannel.appendLine('Server: StartServer: Sending a meta response' + JSON.stringify({result}))
        res.end(JSON.stringify({ result }))
      })
    } else {
      res.writeHead(405)
      res.end()
    }
  })
}

function fetchWebResult(query: string): Promise<string> {
  return new Promise((resolve, reject) => {
    outputChannel.appendLine(`WebSearch: Gathering the web result for "${query}"`)

    // Encode the query
    const encodedQuery = encodeURIComponent(query)
    const url = `https://s.jina.ai/${encodedQuery}`

    // Encode PDF
    //const url = `https://r.jina.ai/${query}`

    outputChannel.appendLine(`WebSearch: Gathering the web result at "${url}"`)
    // Create a status bar item for the progress indicator
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right)
    statusBarItem.text = 'Gathering the web result... 0s'
    statusBarItem.show()

    // Update the progress every second
    let progress = 0
    const progressInterval = setInterval(() => {
      progress += 1
      statusBarItem.text = `Gathering the web result... ${progress}s`
    }, 1000)

    // Set headers for Image Caption and gather links at the end of the response
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-With-Generated-Alt': 'true',
        'X-With-Links-Summary': 'true'
        //'X-No-Cache': 'true'
      },
      timeout: 60000
    }

    // Make the HTTPS GET request
    let data = ''
    const clientRequest = https.request(url, options, response => {
      console.log('Response status:', response.statusCode)
      console.log('Response headers:', response.headers)

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
        reject(err)
      })

      // Handle the response end
      response.on('end', () => {
        // Clear the progress interval and hide the status bar item
        clearInterval(progressInterval)
        statusBarItem.hide()
        statusBarItem.dispose()

        if (response.statusCode !== 200) {
          reject(new Error(`HTTP error! status: ${response.statusCode}`))
          return
        }

        try {
          //outputChannel.appendLine('WebSearch: Recieving end' + data)
          //const webResultsJson = JSON.parse(data)
          //outputChannel.appendLine('WebSearch: Recieving end' + JSON.stringify(webResultsJson))
          //if (webResultsJson.code === 200) {
          /*{
            const extractedInfo = webResultsJson.data.map((item: any) => ({
              title: item.title,
              url: item.url,
              content: item.content
            }))
            // Now, let's format this information into a string
            const formattedResult = extractedInfo
              .map(
                (item: any) =>
                  `Title: ${item.title}\nURL: ${item.url}\nContent: ${item.content}\n\n`
              )
              .join('')
              */
          //outputChannel.appendLine('WebSearch: Recieving end' + formattedResult)
          //console.log(formattedResult)
          resolve(data)
          /*} else {
            reject('WebSearch: Error with code:' + webResultsJson.status)
          }*/
        } catch (err) {
          reject(err)
        }
      })
    })

    clientRequest.on('error', (err: any) => {
      // Clear the progress interval and hide the status bar item
      clearInterval(progressInterval)
      statusBarItem.hide()
      statusBarItem.dispose()

      // Show an error message to the user
      vscode.window.showErrorMessage('An error occurred while making the HTTP request:' + err)
      outputChannel.appendLine('WebSearch: An error occurred while making the HTTP request: ' + err)
      reject('An error occurred while making the HTTP request:' + err.message)
    })

    // Set up the timeout
    clientRequest.on('timeout', () => {
      clearInterval(progressInterval)
      statusBarItem.hide()
      statusBarItem.dispose()
      clientRequest.destroy()
      reject(new Error('Web search request timed out'))
    })

    // Send the request
    clientRequest.end()
  })
}

function splitIntoFiveParts(text: string): string[] {
  const totalLength = text.length
  const partLength = Math.ceil(totalLength / 5)
  const parts: string[] = []

  for (let i = 0; i < 5; i++) {
    const start = i * partLength
    const end = Math.min((i + 1) * partLength, totalLength)
    parts.push(text.slice(start, end))
  }

  return parts
}

export async function stopServer() {
  server.close(() => {
    outputChannel.appendLine('Server: StopServer: Server is closed')
  })
}
