## Change-Log:

### Version 0.0.20 (2024-10-04)

- Added new feature: External File Mention
  - Users can now select external files for mention in Cody chat
  - Files outside the workspace are temporarily copied into the workspace
  - Automatic cleanup of temporary files after use
- Improved UI cleanup after search operations in readPDF and webSearch features
- Enhanced error handling with consistent UI element disposal
- Ensured a cleaner user interface by properly managing progress indicators and status bar items
- Refactored readPDF functionality to improve resource management and logging

### Version 0.0.19 (2024-08-28)

- Improved UI cleanup after search operations in readPDF and webSearch features
- Enhanced error handling with consistent UI element disposal
- Ensured a cleaner user interface by properly managing progress indicators and status bar items
### Version 0.0.18 (2024-07-27)

- Refactored web search and PDF reading functionality to use `fetch` API instead of `https` module
- Switched from `tiktoken` to `js-tiktoken` for more efficient token encoding

### Version 0.0.17 (2024-07-26)

- Implemented token-based truncation using tiktoken library for web search and PDF results
- Enhanced API request headers for improved caching control
- Improved JSON response handling in webSearch function
- Updated dependencies: added tiktoken v1.0.15

### Version 0.0.16 (2024-07-25)

- Enhanced error handling for API responses in readPDF and webSearch features
- Added URL filtering option to narrow down web search results based on domains or sub-domains
- Improved code structure and error reporting in webSearch function

### Version 0.0.15 (2024-07-18)

- Improve PDF logging and bump version to 0.0.15

### Version 0.0.14 (2024-07-17)

- Added configuration setting for user-provided Jina AI API key
- Implemented conditional authorization header in web search and PDF requests
- Improved API key management for enhanced user control and security

### Version 0.0.13 (2024-06-24)

- Update readPDF.ts to handle PDF content display
- Add picomatch type definition file
- Refined the prefix prompt


### Version 0.0.12 (2024-06-19)

- Add logging to readPDF and webSearch features

### Version 0.0.11 (2024-06-18)

- Web Results and PDF results will be saved in the `codyarchitect/webresults`, `codyarchitect/pdfresults` folders respectively.