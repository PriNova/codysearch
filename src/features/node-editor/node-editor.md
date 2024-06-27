## Vision (Node-Editor)

My goal is to create a node-based editor in a vs code extension.

### Architecture:

* Use React and React Flow (or a similar flow-based UI library) to build the node editor UI within a VS Code webview
* Utilize TypeScript for the extension codebase and any required utilities/services

### Node Editor Functionality:

* Allow users to create new "frames" representing code files, with a path and filename
* Within each frame, users can add, remove, and edit nodes
* Each node contains:
    * Input and output ports for connecting to other nodes
    * A text field for entering natural language descriptions
    * A button to generate code from the description using your specified LLM API
* When a user generates code for a node, store the line ranges of the generated code within the node's metadata
* Implement drag-and-drop functionality for nodes between frames

### Code Integration:

* When a node's code is generated, insert it into the corresponding code file based on the frame
* If the generated code overlaps with existing lines, provide a UI for the user to resolve conflicts (e.g., side-by-side diff, manual editing)
* Allow users to manually edit the generated code by clicking the node's header button, which opens the code in a separate editor panel


### State Persistence:

* Serialize the entire state of the node editor (node positions, connections, frame data, etc.) to a JSON file within a specified workspace folder
* Integrate with Git for source control, allowing users to commit and track changes to the node editor state


### Performance Optimizations:

* Implement virtualization techniques for rendering large numbers of nodes and connections
* Leverage code-splitting and lazy-loading to optimize the extension's bundle size and load times

This solution leverages React and TypeScript for the frontend, integrates with your LLM API for code generation, and provides a structured approach to mapping nodes to code files, persisting state, and handling code integration conflicts.