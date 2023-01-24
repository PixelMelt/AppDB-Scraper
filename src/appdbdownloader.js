const axios = require('axios');

function AppIDToUrl(appID, lang, apptype, brand){
    return `https://api.dbservices.to/v1.5/?lang=${lang == undefined ? "en" : lang}&action=get_links&type=${apptype == undefined ? "ios" : apptype}&trackids[]=${appID}&brand=${brand == undefined ? "appdb" : brand}`;
}

async function getAppVersions(url){
    return axios.get(url)
        .then(response => {
            return response.data;
        })
        .catch(error => {
            console.log(error);
        });
}

function pullAppVersions(appdata){
    let appID = Object.keys(appdata.data)[0]
    let appVersions = [];
    for (let i = 0; i < Object.keys(appdata.data[appID]).length; i++) {
        let vernumb = Object.keys(appdata.data[appID])[i]
        for (let j = 0; j < appdata.data[appID][vernumb].length; j++) {
            let appVersionInfo = {
                version: vernumb,
                id: appdata.data[appID][vernumb][j].id,
                host: appdata.data[appID][vernumb][j].host,
                token: appdata.data[appID][vernumb][j].link.replace(`ticket://`,``),
                cracker: appdata.data[appID][vernumb][j].cracker,
                uploader: appdata.data[appID][vernumb][j].uploader_name,
                verified: appdata.data[appID][vernumb][j].verified,
            };
            appVersions.push(appVersionInfo);
        }

    }
    // filter out .onion links
    // appVersions = appVersions.filter(appVersion => !appVersion.host.includes("onion"));
    return appVersions;
}

async function getToken(token){
    let url = `https://api.dbservices.to/v1.5/?lang=en&action=process_redirect&t=${token}&brand=appdb`
    return axios.get(url)
        .then(response => {
            return response.data;
        })
        .catch(error => {
            console.log(error);
        });
}

async function pullTrueDownloadUrl(redirtoken){
    let url = `https://api.dbservices.to/v1.5/?lang=en&action=process_redirect&rt=${redirtoken}&brand=appdb`
    return axios.get(url)
        .then(response => {
            return response.data;
        })
        .catch(error => {
            console.log(error);
        });
}

async function getAppInfo(appID, apptype){
    let url = `https://api.dbservices.to/v1.5/?lang=en&action=search&type=${apptype == undefined ? "ios" : apptype}&trackid=${appID}&brand=appdb`
    return axios.get(url)
        .then(response => {
            return response.data;
        })
        .catch(error => {
            console.log(error);
        });
}

async function getPage(page, apptype){
    let url = `https://api.dbservices.to/v1.5/?lang=en&action=search&type=${apptype}&price=0&genre=0&dev=0&order=added&page=${page}&q=&brand=appdb`
    return axios.get(url)
        .then(response => {
            return response.data;
        })
        .catch(error => {
            console.log(error);
        });
}

async function getUrlFromToken(token, version, name){
    let ticket = await getToken(token)
    let waittime = ticket.data.wait
    
    await new Promise(r => setTimeout(r, waittime * 1000));
    let finalLink = await pullTrueDownloadUrl(ticket.data.redirection_ticket)
    // prune tracking parameters
    if(finalLink.data.link != undefined){
        finalLink.data.link = finalLink.data.link.replace(`?fpdi_ticket=`,``)
    }
    console.log(`Download URL for version ${version}: ${finalLink.data.link}`)
}

async function getAppLinks(appID, apptype, type, name){
    console.log(`Getting download URL for app ID: ${appID}`)
    let appurl = AppIDToUrl(appID, "en", apptype, type)
    let data = await getAppVersions(appurl)
    let appdownloads = pullAppVersions(data)
    console.log(`Found ${appdownloads.length} download links`)
    for (let i = 0; i < appdownloads.length; i++) {
        getUrlFromToken(appdownloads[i].token, appdownloads[i].version, name)
    }
}

async function AppIDToLinks(url){
    let appid = url
    if(appid.toString().includes(`https://`)){
        appid = appid.replace(`https://appdb.to/`,``)
        var type = appid.split(`/`)[0]
        var apptype = appid.split(`/`)[1]
        appid = parseInt(appid.split(`/`)[2])
        console.log(`Found Type: ${type}`)
        console.log(`Found Apptype: ${apptype}`)
        console.log(`Found Appid: ${appid}`)
    }
    let appinfo = await getAppInfo(appid, apptype, type)
    console.log(`Found Name: ${appinfo.data[0].name}`)
    await getAppLinks(appid, apptype, type, appinfo.data[0].name)
}

((async () => {
    await AppIDToLinks(process.argv[2])    
})());
