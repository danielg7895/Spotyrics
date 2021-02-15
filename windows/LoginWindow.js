const { BrowserWindow } = require('electron')

var loginWindow = null

const showLogin = () => {
    // falta cerrar la ventana una vez logeado automaticamente
    // o en su defecto, detectar con el metodo getAccessToken si estoy logeado
    // si estoy cerrar esta ventana y mostrar un mensaje "conectado correctamente"
    loginWindow = new BrowserWindow({
        width: 500,
        height: 800,
        x: 0,
        y: 100,
        alwaysOnTop: false,
        backgroundColor: "#1b1b1b",
        webPreferences: {
        nodeIntegration: false
        }
    })

    //loginWindow.menuBarVisible = false;
    loginWindow.loadURL('http://spotify.com/login?')
}
  
module.exports = {
    showLogin,
    loginWindow
}