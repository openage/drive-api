'use strict'

var HttpClient = require('node-rest-client').Client
var formatter = require('./template').formatter

const extractContext = (context) => {
    let current = {}

    if (context.tenant) {
        current.tenant = {
            id: context.tenant.id,
            code: context.tenant.code,
            name: context.tenant.name,
            logo: context.tenant.logo
        }
    }

    if (context.organization) {
        current.organization = {
            id: context.organization.id,
            code: context.organization.code,
            shortName: context.organization.shortName,
            name: context.organization.name,
            logo: context.organization.logo,
            address: {}
        }

        if (context.organization.address) {
            current.organization.address = {
                line1: current.organization.address.line1,
                line2: current.organization.address.line2,
                district: current.organization.address.district,
                city: current.organization.address.city,
                state: current.organization.address.state,
                pinCode: current.organization.address.pinCode,
                country: current.organization.address.country
            }
        }
    }

    if (context.user) {
        current.user = {
            id: context.user.id,
            code: context.user.code,
            profile: {
                firstName: context.user.firstName,
                lastName: context.user.lastName
            },
            role: {
                id: context.user.role.id,
                key: context.user.role.key
            }
        }
    }

    return current
}

exports.fetch = async (source, context) => {
    let current = extractContext(context)

    if (!source.dataSource) {
        return convertToArray(source, current)
    }
    const dataSource = source.dataSource

    source = {
        type: dataSource.type,
        connectionString: formatter(dataSource.connectionString).inject({
            params: dataSource.params,
            data: source.data,
            context: current
        }),
        config: JSON.parse(formatter(JSON.stringify(dataSource.config || {})).inject({
            params: dataSource.params,
            data: source.data,
            context: current
        })),
        data: source.data,
        params: dataSource.params,
        field: dataSource.field
    }

    let data
    switch (source.type) {
        case 'http':
            data = await getFromUrl(source, 10, context)
            break
        case 'file':
            data = await getFromFile(source, context)
            break

        default:
            throw new Error(`data source '${source.type}' not supported`)
    }
    return convertToArray(data, current)
}

const getFromFile = (source, context) => {
    context.logger.info('getting data from file', source)
    return new Promise(function (resolve, reject) {
        require('jsonfile').readFile(source.connectionString, function (err, fileData) {
            if (err) {
                reject(err)
            } else {
                let data = source.field ? fileData[source.field] : (fileData.data || fileData.items || fileData)
                resolve(data)
            }
        })
    })
}

const getFromUrl = (source, attempts, context) => {
    context.logger.info('getting data from url', source)

    let log = context.logger.start('getData attempt:' + attempts)

    let httpClient = new HttpClient()

    return new Promise(function (resolve, reject) {
        httpClient.get(source.connectionString, { headers: source.config.headers }, function (serverData) {
            if (serverData.IsSuccess || serverData.isSuccess) {
                let data = source.field ? serverData[source.field] : serverData.data || serverData.items
                resolve(data)
            } else {
                return reject(serverData.error || 'server did not return isSuccess')
            }
        }).on('error', function (err) {
            log.error(err)
            if (attempts === 0) {
                return reject(new Error(`could not get data from -${source.url}`))
            }
            return getFromUrl(source, --attempts, context)
        })
    })
}

var convertToArray = function (data, current) {
    var items = []
    if (Array.isArray(data)) {
        items = data.map(i => {
            i.context = current
            return i
        })
    } else {
        data.context = current
        items.push(data)
    }

    return items
}
