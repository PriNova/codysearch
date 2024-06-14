import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "codyarchitect" is now active!');
  const disposable = vscode.commands.registerCommand('codyarchitect.helloWorld', () => {
    vscode.window.showInformationMessage('Hello World from CodyArchitect!');
  });
  context.subscriptions.push(disposable);
}

export function deactivate() {}
