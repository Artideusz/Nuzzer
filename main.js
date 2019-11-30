const http = require('http');
const https = require('https');
const urlUtil = require('url');
const fs = require('fs');

function urlOpt(url='https://google.com/') {
    const parsed = urlUtil.parse(url);
    return {
        method: 'HEAD',
        port: (parsed.protocol === 'https:')? parsed.port || 443 : parsed.port || 80,
        hostname: parsed.hostname,
        path: parsed.pathname,
        timeout: 1*5000
    }
}

function requestHEAD(url='https://google.com/') {
    const opt = urlOpt(url);
    const req = opt.port === 443 ? https : http;
    return new Promise((rs, rj)=>{
        let request = req.request(opt, (res)=>{
            console.log(url, res.statusCode);
            rs({
                link: url,
                status: res.statusCode
            });
        })
        request.on('error',(e)=>{
            console.log(url, 'Invalid URL');
            rs({
                link: url,
                status: null,
                error: 'Invalid URL'
            });
        })
        request.on('timeout', ()=>{
            console.log(url, 'Timed out');
            rs({
                link: url,
                status: null,
                error: 'Connection timed out'
            });
            request.abort();
        })
        request.end();
    })
}

function fetchWords(rawurl, fast) {
    return new Promise((rs, rj)=>{
        let rd = fs.createReadStream('./words.txt', 'utf-8');
        let data = '';
        rd.on('data', (chunk)=>{
            data+=chunk;
        })
        rd.on('end', ()=>{
            const list = data.split('\r\n').map(v => `${rawurl}${v}`);
            rs(fast ? list.slice(0,list.length/4) : list);
        })
        rd.on('error',(e)=>{
            rj(e);
        })
    })
}

function createJSONList(arr, rawurl) {
    try {
        if(arr.length == 0) throw '';
        return arr
        .reduce((obj,resolve)=>{
            switch(resolve.status) {
                case 200:
                    obj['OK'].push(resolve);
                    return obj;
                case 301 || 302:
                    obj['REDIRECT'].push(resolve);
                    return obj;
                case 400:
                    obj['BAD_REQUEST'].push(resolve);
                    return obj;
                case 403:
                    obj['FORBIDDEN'].push(resolve);
                    return obj;
                case 404:
                    obj['NOT_FOUND'].push(resolve);
                    return obj;
                default:
                    obj['OTHER'].push(resolve);
                    return obj;
            }
        }, { main_link: rawurl, OK: [], REDIRECT: [], FORBIDDEN: [], NOT_FOUND: [], BAD_REQUEST: [], OTHER: [] });
    }catch(e) {
        return {
            error: e
        }
    }
}

async function fuzz1({url=null, time=1000, fast=false }={}) {
    if(!url) return { error: 'No URL given' };
    return new Promise(async(rs, rj)=>{
        const urls = await fetchWords(url, fast);
        let count = 0;
        const promises = [];
        const x = setInterval(async()=>{
            if(count > urls.length - 1){
                clearInterval(x);
                rs(createJSONList(await Promise.all(promises), url));
            } else {
                console.log('SENT: ', urls[count], urls.length-count);
                promises[count] = requestHEAD(urls[count]);
                count++;
            }
        }, time);
    }).catch((e)=>{
        return {
            error : e.message
        }
    })
}

module.exports = {
    urlOpt,
    requestHEAD,
    fetchWords,
    createJSONList,
    fuzz1
}