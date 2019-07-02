'use strict'

exports.extract = req => {
    let pageNo = req.query.pageNo ? Number(req.query.pageNo) : 1
    let serverPaging = req.query.serverPaging
    let pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10
    let offset = pageSize * (pageNo - 1)

    if (serverPaging === undefined) {
        if (req.query.pageNo !== undefined || req.query.pageSize !== undefined) {
            serverPaging = true
        }
    }

    return serverPaging ? {
        pageNo: pageNo,
        limit: pageSize,
        skip: offset
    } : null
}