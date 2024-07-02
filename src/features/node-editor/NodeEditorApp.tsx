import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'

/**
 * Represents a frame in the Node Editor UI.
 *
 * A frame has an unique identifier (`id`), a display name (`name`), and a file path (`path`).
 */
export interface Frame {
  id: string
  name: string
  path: string
}

export interface Node {
  id: string
  name: string
  frameId: string
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
  return <button onClick={() => onDelete(frameId)}>Delete Frame</button>
}

const CreateNodeButton: React.FC<{
  newNodeName: string
  selectedFrameId: string
  onCreate: () => void
}> = ({ newNodeName, selectedFrameId, onCreate }) => {
  return (
    <button onClick={onCreate} disabled={!newNodeName || !selectedFrameId}>
      Create Node
    </button>
  )
}

const DeleteNodeButton: React.FC<{
  nodeId: string
  onDelete: (id: string) => void
}> = ({ nodeId, onDelete }) => {
  return <button onClick={() => onDelete(nodeId)}>Delete Node</button>
}

interface FrameSelectorProps {
  frames: Frame[]
  selectedFrameId: string
  onFrameSelect: (frameId: string) => void
}

const FrameSelector: React.FC<FrameSelectorProps> = ({
  frames,
  selectedFrameId,
  onFrameSelect
}) => {
  return (
    <select value={selectedFrameId} onChange={e => onFrameSelect(e.target.value)}>
      <option value="">Select a Frame</option>
      {frames.map(frame => (
        <option key={frame.id} value={frame.id}>
          {frame.name}
        </option>
      ))}
    </select>
  )
}

// Node Editor App component
const NodeEditorApp: React.FC = () => {
  // State for frames
  const [frames, setFrames] = useState<Frame[]>([])
  const [newFrameName, setNewFrameName] = useState('')
  const [newFramePath, setNewFramePath] = useState('')

  const [nodes, setNodes] = useState<Node[]>([])
  const [newNodeName, setNewNodeName] = useState('')
  const [selectedFrameId, setSelectedFrameId] = useState('')

  // Handle input change events
  useEffect(() => {
    // Set up event listener for messages from the extension for future updates
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

      // Add frame to list of frames
      setFrames(prevFrames => [...prevFrames, newFrame])

      // Send message to extension
      vscode.postMessage({
        type: 'frame',
        action: 'create',
        frame: newFrame
      })

      // Reset input fields
      setNewFrameName('')
      setNewFramePath('')
    }
  }

  // Handle delete button click events
  const deleteFrame = (id: string) => {
    // Get frame by id and remove it from the list of frames
    setFrames(prevFrames => prevFrames.filter(frame => frame.id !== id))

    // Send message to extension
    vscode.postMessage({
      type: 'frame',
      action: 'delete',
      id: id
    })
  }

  // Handle create Button for Nodes
  const createNode = () => {
    // Check if both fields are filled
    if (newNodeName && selectedFrameId) {
      const newNode: Node = {
        id: Date.now().toString(),
        name: newNodeName,
        frameId: selectedFrameId
      }

      // Add node to list of nodes
      setNodes(prevNodes => [...prevNodes, newNode])

      // Send message to extension
      vscode.postMessage({
        type: 'node',
        action: 'create',
        node: newNode
      })

      setNewNodeName('')
      setSelectedFrameId('')
    }
  }

  const deleteNode = (id: string) => {
    // Get node by id and remove it from the list of nodes
    setNodes(prevNodes => prevNodes.filter(node => node.id !== id))

    // Send message to extension
    vscode.postMessage({
      type: 'node',
      action: 'delete',
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
      <div>
        <input
          type="text"
          placeholder="Node Name"
          value={newNodeName}
          onChange={e => setNewNodeName(e.target.value)}
        />
        <FrameSelector
          frames={frames}
          selectedFrameId={selectedFrameId}
          onFrameSelect={setSelectedFrameId}
        />
        <CreateNodeButton
          newNodeName={newNodeName}
          selectedFrameId={selectedFrameId}
          onCreate={createNode}
        />
      </div>
      <div>
        <h2>Nodes:</h2>
        <ul>
          {nodes.map(node => (
            <li key={node.id}>
              {node.name} - Frame: {frames.find(f => f.id === node.frameId)?.name}
              <DeleteNodeButton nodeId={node.id} onDelete={deleteNode} />
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
