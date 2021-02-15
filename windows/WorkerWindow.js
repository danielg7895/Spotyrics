const {BrowserWindow} = require('electron')
const axios = require('axios')

const { CURRENT_PLAYBACK_URI, LYRICS_URL } = require('../vars.js')


var workerWindow = null;
var SPOTIFY_ACCESS_TOKEN = null
var anonymous = false;


const startWorker = async () => {
    workerWindow = new BrowserWindow({frame: false, transparent: true})
    workerWindow.hide()
    workerWindow.loadURL('https://open.spotify.com/get_access_token?reason=transport&productType=web_player')

    await renewAccessToken()
}

const getAccessTokenData = async () => {
    // This function gets the access token using a url used by the spotify web client
    //
    // I'm getting the access token in this way instead of using Spotify API because 
    // the token that this url returns works with the private API that spotify uses to get the lyrics of the songs
    // If i use the official API to get the access token the lyrics api will return "token not authorized"
    // Also, this url returns a key isAnonymous, useful to check if im logged in or not.
    // Also, this endpoint refresh the token automatically
    // Also, it's easier... until spotify changes this.

    workerWindow.loadURL('https://open.spotify.com/get_access_token?reason=transport&productType=web_player')

    // Read the response json from the worker window and return it.
    return new Promise(resolve => {
        workerWindow.webContents.on('did-finish-load', ()=> {
        let code = `var promise = Promise.resolve(document.documentElement.innerText);
                    promise.then(data => data)`;
        
        workerWindow.webContents.executeJavaScript(code, true).then(
            (response) => {
                resolve(JSON.parse(response))
            })
        });
    })
}

const renewAccessToken = async () => {
    var accessTokenData = await getAccessTokenData()
    console.log(accessTokenData)
    anonymous = accessTokenData["isAnonymous"]
    SPOTIFY_ACCESS_TOKEN = accessTokenData["accessToken"]
    if (!SPOTIFY_ACCESS_TOKEN) {
        console.log("FOR SOME REASON ACCESS TOKEN IS NULL")
    }
}

// https://developer.spotify.com/console/get-user-player/?market=&additional_types=
const getCurrentPlaybackData = async () => {
    try {

        const response = await axios.get(CURRENT_PLAYBACK_URI, {headers : { 
            "Authorization" : "Bearer " + SPOTIFY_ACCESS_TOKEN,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36",
            "accept" : "application/json"
        }})
        
        return response.data
    } 
    catch (error) {
        if (error.response) {
            // 4xx, 5xx error
            console.log(error.response)
            console.log(error.message)
            return error.response.status
        }
        return null
    }
}


// returns a JSON object with the connected user playing lyrics data 
const getLyricsData = async (currently_song_id) => {
    if (currently_song_id == null) 
    {
        return null
    }

    const lyrics_url = LYRICS_URL + currently_song_id
  
    try {
        const response = await axios.get(lyrics_url, {headers : { "Authorization" : "Bearer " + SPOTIFY_ACCESS_TOKEN }})

        return response.data
    }
    catch (error) {
        console.log(error.response)
        console.log(error.message)
    }
}


module.exports = {
    startWorker,
    renewAccessToken,
    getCurrentPlaybackData,
    getLyricsData,

    anonymous,
    workerWindow
}