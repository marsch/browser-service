const {app, BrowserWindow, ipcMain} = require('electron')
const Hapi = require('hapi')
const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
let restservice


const browserService = {
    get(url) {
        console.log()
    }
}



const createWindow = () => {
  // Create the browser window.
  win = new BrowserWindow({width: 800, height: 600})

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    restservice = new Hapi.Server()
    restservice.connection({
        host: 'localhost',
        port: 8080
    })
    restservice.route({
        method: 'GET',
        path: '/browser/{url}',
        handler: (request, reply) => {
            const {url} = request.params

            ipcMain.on('gpu', (_, gpu) => {
                console.log('gpu', gpu)
            })

            win.loadURL(url)
            win.webContents.on('dom-ready', (args) => {
                win.webContents.executeJavaScript(`
                    const x = require('electron').ipcRenderer
                    alert('x', x)
                    debugger
                    require('electron').ipcRenderer.send('gpu', document.body.innerHTML);
                `);
                console.log(args)
                console.log(win.webContents)
            })


            return reply('FUCK YA ' + url)
        }
    })
    restservice.start((err) => {
        if (err) {
            throw err;
        }
        console.log('Server running at:', restservice.info.uri);
    })
    createWindow()
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})
