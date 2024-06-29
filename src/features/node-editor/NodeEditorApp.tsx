import React from 'react'
import ReactDOM from 'react-dom'

/**
 * Renders the main Node Editor application component.
 * This component displays the title and a brief description of the Node Editor.
 */
const NodeEditorApp: React.FC = () => {
  return (
    <div>
      <h1>Node Editor</h1>
      <p>This is a React-based Node Editor!</p>
    </div>
  )
}

/**
 * Renders the main Node Editor application component to the DOM element with the ID 'root'.
 */
function renderApp() {
  ReactDOM.render(<NodeEditorApp />, document.getElementById('root'))
}

renderApp()
