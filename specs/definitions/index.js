'use strict'
const fs = require('fs')
const changeCase = require('change-case')

const definitions = {}

const formDefinition = data => {
    let def = {}

    if (typeof data === 'string') {
        return {
            type: data
        }
    }
    for (var key in data) {
        if (Array.isArray(data[key])) {
            const arrayItem = data[key].length ? data[key][0] : {}

            const itemDef = {}
            if (Array.isArray(arrayItem)) {
                itemDef.type = 'array'
                itemDef.properties = formDefinition(arrayItem)
            } else if (typeof arrayItem === 'object') {
                itemDef.type = 'object'
                itemDef.properties = formDefinition(arrayItem)
            } else {
                itemDef.type = arrayItem
            }

            def[key] = {
                type: 'array',
                items: itemDef
            }
        } else if (typeof data[key] === 'object') {
            def[key] = {
                type: 'object',
                properties: formDefinition(data[key])
            }
        } else {
            def[key] = {
                type: data[key]
            }
        }
    }

    return def
}

const extract = (data, name) => {
    if (data.properties) {
        return [data]
    }

    let def = formDefinition(data)
    let modelReq = {
        name: `${name}Req`,
        definition: {
            type: 'object',
            properties: def
        }
    }

    let modelRes = {
        name: `${name}Res`,
        definition: {
            type: 'object',
            properties: {
                isSuccess: {
                    type: 'boolean',
                    description: 'true'
                },
                error: {
                    type: 'string',
                    description: 'error details'
                },
                message: {
                    type: 'string',
                    description: 'validation message'
                },
                data: {
                    type: 'object',
                    properties: def
                }
            }
        }
    }

    let pageRes = {
        name: `${name}PageRes`,
        definition: {
            properties: {
                isSuccess: {
                    type: 'boolean',
                    description: 'true'
                },
                error: {
                    type: 'string',
                    description: 'error details'
                },
                message: {
                    type: 'string',
                    description: 'validation message'
                },
                items: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: def
                    }
                }
            }
        }
    }

    return [modelReq, modelRes, pageRes]
}

const setDefaults = (data, fileName) => {
    let item = {
        name: null,
        definition: {}
    }

    if (data.definition) {
        item.name = data.name || changeCase.camelCase(fileName)
        item.definition.type = data.definition.type || 'object'
        item.definition.properties = data.definition.properties
    } else if (data.properties) {
        item.name = data.name || changeCase.camelCase(fileName)
        item.definition.type = data.type || 'object'
        item.definition.properties = data.properties
    } else {
        item.name = changeCase.camelCase(fileName)
        item.definition.properties = data
        item.definition.type = 'object'
    }
    return item
};

(function () {
    fs.readdirSync(__dirname).forEach(function (file) {
        if (file.indexOf('.js') && file.indexOf('index.js') < 0) {
            let name = file.split('.')[0]
            let data = require('./' + file)
            if (!data.forEach) {
                data = extract(data, changeCase.camelCase(name))
            }
            data.forEach(item => {
                item = setDefaults(item, name)
                definitions[item.name] = item.definition
            })
        }
    })
})()

module.exports = definitions
