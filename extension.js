const vscode = require('vscode')
const jsonServer = require('json-server')
const path = require('path')
const chokidar = require('chokidar')

function activate(context) {
  let server // Declare server variable outside of the runMockServer function

  // Register the "Run Mock Server" command
  const runMockServer = vscode.commands.registerCommand(
    'extension.runMockServer',
    () => {
      const editor = vscode.window.activeTextEditor
      if (editor) {
        const filePath = editor.document.uri.fsPath
        if (path.extname(filePath) === '.json') {
          server = jsonServer.create()
          const router = jsonServer.router(filePath)
          server.use(jsonServer.defaults())
          server.use(router)
          server.listen(8080, () => {
            vscode.window.showInformationMessage(
              `JSON Server is running on http://localhost:8080`
            )
          })

          // Watch for changes to the JSON file and reload the server
          const watcher = chokidar.watch(filePath)
          watcher.on('change', () => {
            console.log('Reloading JSON Server...')
            server.close(() => {
              server = jsonServer.create()
              const router = jsonServer.router(filePath)
              server.use(jsonServer.defaults())
              server.use(router)
              server.listen(8080, () => {
                console.log('JSON Server reloaded.')
              })
            })
          })
        } else {
          vscode.window.showErrorMessage(
            'The active file is not a db.json file.'
          )
        }
      } else {
        vscode.window.showErrorMessage('No active editor found.')
      }
    }
  )

  // Add a context menu item for "Run Mock Server" when a db.json file is right-clicked
  const disposableContextMenu = vscode.commands.registerCommand(
    'extension.showMockServerContextMenu',
    (uri) => {
      const filePath = uri.fsPath
      if (path.extname(filePath) === '.json') {
        vscode.commands.executeCommand(
          'setContext',
          'showMockServerOption',
          true
        )
      } else {
        vscode.commands.executeCommand(
          'setContext',
          'showMockServerOption',
          false
        )
      }
    }
  )

  // When a db.json file is opened, enable the "Run Mock Server" context menu item
  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor && path.basename(editor.document.uri.fsPath) === 'db.json') {
      vscode.commands.executeCommand('setContext', 'showMockServerOption', true)
    } else {
      vscode.commands.executeCommand(
        'setContext',
        'showMockServerOption',
        false
      )
    }
  })

  // Register the commands and context menu items
  context.subscriptions.push(runMockServer, disposableContextMenu)
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
}
