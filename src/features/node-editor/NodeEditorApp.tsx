import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'

interface Frame {
  id: string
  name: string
  path: string
}

// Declare vscode API
declare global {
  interface Window {
    acquireVsCodeApi(): {
      postMessage(message: any): void
    }
  }
}

const vscode = window.acquireVsCodeApi()

const NodeEditorApp: React.FC = () => {
  const [frames, setFrames] = useState<Frame[]>([])
  const [newFrameName, setNewFrameName] = useState('')
  const [newFramePath, setNewFramePath] = useState('')

  useEffect(() => {
    // Set up event listener for messages from the extension
    window.addEventListener('message', event => {
      const message = event.data
      switch (message.type) {
        case 'updateFrames':
          setFrames(message.frames)
          break
      }
    })
  }, [])

  const createFrame = () => {
    if (newFrameName && newFramePath) {
      const newFrame: Frame = {
        id: Date.now().toString(),
        name: newFrameName,
        path: newFramePath
      }

      // Send message to extension
      vscode.postMessage({
        command: 'createFrame',
        frame: newFrame
      })

      setNewFrameName('')
      setNewFramePath('')
    }
  }

  const deleteFrame = (id: string) => {
    // Send message to extension
    vscode.postMessage({
      command: 'deleteFrame',
      id: id
    })
  }

  return (
    <div>
      <h1>Node Editor</h1>
      <div>
        <input
          type="text"
          placeholder="Frame Name"
          value={newFrameName}
          onChange={e => setNewFrameName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Frame Path"
          value={newFramePath}
          onChange={e => setNewFramePath(e.target.value)}
        />
        <button onClick={createFrame}>Create Frame</button>
      </div>
      <div>
        <h2>Frames:</h2>
        <ul>
          {frames.map(frame => (
            <li key={frame.id}>
              {frame.name} - {frame.path}
              <button onClick={() => deleteFrame(frame.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function renderApp() {
  ReactDOM.render(<NodeEditorApp />, document.getElementById('root'))
}

renderApp()
