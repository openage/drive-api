const webHook = require('../../../../helpers/web-hook')
const templateHelper = require('../../../../helpers/template')
const fileMapper = require('../../../../mappers/file')
const contextMapper = require('../../../../mappers/context')

exports.process = async (file, context) => {
    if (!file) {
        return
    }
    if (file.hooks && file.hooks.length) {
        let temp = file.hooks[0]
        temp.trigger = 'active'
        temp.data.status = 'awarded'
    }    









    let hook = file.hooks ? file.hooks.find(h => h.trigger.toLowerCase() === file.status.toLowerCase()) : null

    if (!hook) {
        return
    }

    let data = fileMapper.toModel(file, context)
    data.context = contextMapper.toModel(context)

    hook = JSON.parse(templateHelper.formatter(JSON.stringify(hook)).inject(data))

    await webHook.send(hook, data, context)
}
