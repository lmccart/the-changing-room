const fs = require('fs');
const Papa = require('papaparse');
const i18next = require('i18next');

const getChatSubData = async(lang) => {
  const tsvFile = fs.readFileSync(`./static/data/${lang}/04_substitutions_${lang}.tsv`); // Change to desired filename
  const tsvData = tsvFile.toString();
  return new Promise(resolve => {
    Papa.parse(tsvData, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: results => {
        const rawResults = results.data;
        // the data comes in as [{angry: 'string', sad: 'string'}, ...]
        // I (sam) think it should be {angry: ['string', 'string'], sad:['string', 'string']...}
        const reordered = {};
        const keys = Object.keys(rawResults[0]);
        keys.forEach(key => reordered[key] = []);

        for (var i = 0; i < rawResults.length; i++) {
          const resultRow = rawResults[i];
          keys.forEach(key => resultRow[key].trim().length > 0 && reordered[key].push(resultRow[key]));
        }
        resolve(reordered);
      }
    });
  });
};

module.exports = {
  getChatSubData,
};