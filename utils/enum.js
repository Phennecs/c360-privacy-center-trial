class Enum {
    constructor(constantsList) {
        constantsList.forEach(constant => this[constant] = constant);
    }
}

module.exports = Enum;