const stringify = require('csv-stringify');
const parse = require('csv-parse');

// https://developer.salesforce.com/docs/atlas.en-us.api_bulk_v2.meta/api_bulk_v2/datafiles_prepare_csv.htm

const delimiter = ','; // Must match the delimiter value in the bulk api job, defaults to comma there

function extractUniqueKeysFromObjArray(objectArr) {
    const fieldSet = new Set();
    objectArr.forEach(record => Object.keys(record).forEach(field => fieldSet.add(field)));
    return [...fieldSet];
}

// Put id column before everything else
function sortSfKeys(a, b) {
    if (a == 'id') return -1;
    if (b == 'id') return 1;
    if (a == 'sf__Id') return -1;
    if (b == 'sf__Id') return 1;
    return 0;
}

// This takes a standard json object (not string) and converts it to a salesforce-bulk-API-v2-friendly csv file string
function objectToSfCsv(objectArr) {
    return new Promise((resolve, reject) => {
        stringify(objectArr, {
            header: true, // Include header record
            delimiter,
            record_delimiter: 'unix', // \n line feed
            columns: extractUniqueKeysFromObjArray(objectArr).sort(sortSfKeys) // Set the columns the unique superset of all columns in this array of objects
        }, (err, csvString) => {
            if (err) {
                reject(err);
            }
            resolve(csvString);
        });
    });
}

function sfCsvToObject(csvString) {
    return new Promise((resolve, reject) => {
        parse(csvString, {
            delimiter,
            columns: true // Infer columns from the first line
        }, (err, objectArr) => {
            if (err) {
                reject(err);
            }
            resolve(objectArr);
        });
    });
}

module.exports = {
    objectToSfCsv,
    sfCsvToObject
};