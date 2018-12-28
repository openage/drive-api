'use strict'

exports.canCreate = async (req) => {
    if (!req.code) {
        return 'client code required'
    }
}
