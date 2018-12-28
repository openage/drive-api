'use strict'

exports.canCreate = async (req) => {
    if (!req.body.owner) { return 'app owner required' }

    if (!req.body.code) { return 'app code required' }

    if (!req.body.name) { return 'app name required' }
}
