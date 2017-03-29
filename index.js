const request = require('request');
const xmlparse = require('xml2json');
const cheerio = require('cheerio');
const fs = require('fs');

const getActionPageURLs = () =>
  new Promise((resolve, reject) => {
    request.get({
      uri: 'http://docs.aws.amazon.com/sitemap_index.xml',
    }, (err, res) => {
      if (err) {
        reject(err);
      } else {
        const jsonStr = xmlparse.toJson(res.body)
        const siteMap = JSON.parse(jsonStr).sitemapindex.sitemap;

        const actionPageURLs = [];

        siteMap.forEach(sitemap => {
          const refLink = sitemap.loc.match(/\/APIReference\//);
          if (refLink) {
            const actionURL = sitemap.loc.replace(/sitemap.xml$/, 'API_Operations.html')
            actionPageURLs.push(actionURL);
          }
        });

        resolve(actionPageURLs);
      }
    });
  });

const getActionsFromPage = (url) =>
  new Promise((resolve, reject) => {
    request.get({ url }, (err, res) => {
      if (err) {
        reject(err);
      } else {
        const $ = cheerio.load(res.body);
        const actionsList = $('ul.itemizedlist a').map((i, el) => {
          return $(el).text();
        }).get();
        resolve(actionsList)
      }
    });
  });

// const url = 'http://docs.aws.amazon.com/IAM/latest/APIReference/API_Operations.html'

getActionPageURLs().then(result => {

  result.forEach(url => {
    getActionsFromPage(url).then(res => {
      const data = {
        service: url.match(/.com\/(.+)\/latest/)[1],
        actions: res,
      }

      fs.appendFile(`output.json`, `${JSON.stringify(data, null, 2)}\n`);
    });
  });

}).catch(err => console.log(err));
