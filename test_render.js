const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const html = fs.readFileSync('index.html', 'utf8');
const appjs = fs.readFileSync('app.js', 'utf8');
const datajs = fs.readFileSync('data.js', 'utf8');

const dom = new JSDOM(html, { runScripts: "dangerously" });
dom.window.eval(datajs);
try {
  dom.window.eval(appjs);
  console.log("Scripts loaded.");
  setTimeout(() => {
    console.log("Grid children count: " + dom.window.document.getElementById('movieGrid').children.length);
  }, 1000);
} catch (e) {
  console.error(e);
}
