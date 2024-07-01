import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'

// Frame interface
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

// Get vscode API
const vscode = window.acquireVsCodeApi()

// CreateFrameButton component
const CreateFrameButton: React.FC<{
  newFrameName: string
  newFramePath: string
  onCreate: () => void
}> = ({ newFrameName, newFramePath, onCreate }) => {
  return (
    <button onClick={onCreate} disabled={!newFrameName || !newFramePath}>
      Create Frame
    </button>
  )
}

// DeleteFrameButton component
const DeleteFrameButton: React.FC<{
  frameId: string
  onDelete: (id: string) => void
}> = ({ frameId, onDelete }) => {
  return (
    <button onClick={() => onDelete(frameId)}>
      Delete Frame
    </button>
  )
}


// Node Editor App component
const NodeEditorApp: React.FC = () => {
  // State for frames
  const [frames, setFrames] = useState<Frame[]>([])
  const [newFrameName, setNewFrameName] = useState('')
  const [newFramePath, setNewFramePath] = useState('')

  // Handle input change events
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

  // Handle create button change events
  const createFrame = () => {
    // Check if both fields are filled
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

      // Reset input fields
      setNewFrameName('')
      setNewFramePath('')
    }
  }

  // Handle delete button click events
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
        <CreateFrameButton
          newFrameName={newFrameName}
          newFramePath={newFramePath}
          onCreate={createFrame}
        />
      </div>
      <div>
        <h2>Frames:</h2>
        <ul>
          {frames.map(frame => (
            <li key={frame.id}>
              {frame.name} - {frame.path}
              <DeleteFrameButton frameId={frame.id} onDelete={() => deleteFrame(frame.id)} />
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
