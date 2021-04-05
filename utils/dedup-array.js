function dedupArray(array) {
    return [ ...new Set(array) ];
}

module.exports = dedupArray;