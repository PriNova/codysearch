# Cody-Architect

Cody-Architect is a VSCode extension that extends [Cody](https://sourcegraph.com/cody) with additional capabilities.

1. Web search
2. Reading PDFs

[![](https://img.shields.io/badge/Cody_Architect-Ask_Cody-%238A16D7?labelColor=%23383838)](https://sourcegraph.com/github.com/PriNova/codysearch)
[![X (formerly Twitter) Follow](https://img.shields.io/twitter/follow/PriNova75)](https://twitter.com/PriNova75)

## Requirements:

- To use this extension, first install [Cody](https://marketplace.visualstudio.com/items?itemName=sourcegraph.cody-ai) from the VS Code Marketplace.

## Installation Instruction:

- Install [Cody-Architect](https://marketplace.visualstudio.com/items?itemName=PriNova.cody-architect) from the Visual Studio Code Marketplace
- Or directly from VS Code

## Jina AI API Key Configuration:

Cody Architect now supports user-provided API keys for Jina AI services, allowing for better control over token usage and faster result requests.

1. Obtain a Jina AI API key from [http://jina.ai](http://jina.ai)
2. In VS Code, open Settings (File > Preferences > Settings)
3. Search for "Cody Architect"
4. Find the "Cody Architect: Jina Api Key" setting
5. Enter your Jina AI API key in the provided field

Alternatively, you can set the API key using the command palette:

1. Press Ctrl+Shift+P (Windows/Linux) or Cmd+Shift+P (Mac)
2. Search for "Cody Architect: Set Jina AI API Key"
3. Enter your API key when prompted

Once set, Cody Architect will use your personal API key for web searches and PDF reading operations.


## How-To:

![Animation2](https://github.com/PriNova/codysearch/assets/31413214/933cfc72-b950-4474-98ab-863e0b3927e8)

## New Features (2024-07-25):

### Enhanced Web Search:

1. URL Filtering: You can now narrow down your web search results by providing a specific URL.
   - After entering your search query, you'll be prompted to enter a URL to filter the results to a specific URL domain or sub-domain (e.g. blender.org, docs.blender.org/manual/en/latest)
   - This is optional and an empty URL will return all results.
   - This allows for more targeted and relevant search outcomes.

2. Improved Error Handling:
   - The extension now provides better feedback for API errors. (recharge/refresh the Jina.ai API key)
   - Error messages are displayed both in the VS Code interface and the output channel for easier troubleshooting.

### Web Search:

1. Open a Cody chat window
1. Press Ctrl+Shift+P (Windows/Linux) or Cmd+Shift+P (Mac) to bring up the Command Palette
1. Search for "Cody Architect - Search the web"
1. The Input Prompt Box appears and there you can input your search query.
1. (OPTIONAL) The next input prompt will ask you to enter a URL to filter the results to a specific URL domain or sub-domain (e.g. blender.org, docs.blender.org/manual/en/latest)
1. Wait for about max 10 seconds until the query will be inserted into the Cody Chat input box.
1. Submit the query by pressing Enter in the Chat view if it is displayed as '@' mention file

#### Note: If the query does result into an error, try again. Utilize natural language to fine-tune your search query.

## New Features (2024-10-04):

### External File Mention:

1. Open a Cody chat window
2. Press Ctrl+Shift+P (Windows/Linux) or Cmd+Shift+P (Mac) to bring up the Command Palette
3. Search for "Cody Architect: Select External File for Mention"
4. A file selection dialog will appear. Choose the file you want to mention.
5. If the selected file is outside your workspace, it will be temporarily copied into the workspace.
6. The selected file will be mentioned in the Cody chat, allowing you to reference external files easily.

Note: Temporary files created for external file mentions are automatically cleaned up after use.

This feature allows you to easily reference and discuss files that are not part of your current workspace, enhancing collaboration and code review processes.

### Read PDFs:

1. Open a Cody chat window
1. Press Ctrl+Shift+P (Windows/Linux) or Cmd+Shift+P (Mac) to bring up the Command Palette
1. Search for "Cody Architect - Read PDF"
1. The Input Prompt Box appears and there you can input the URL to the public available PDF file (ArXiv, PubMed, etc).
1. Wait for about max 5 seconds until the query will be inserted into the Cody Chat input box.
1. Submit the result by pressing Enter in the Chat view if it is displayed as '@' mention file

In both cases, you will see a progress indicator in the Statusbar about the progress.