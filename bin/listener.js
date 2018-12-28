'use strict'
global.Promise = require('bluebird')
const logger = require('@open-age/logger')('bin/listener').start('booting')
const offline = require('@open-age/offline-processor')

require('../settings/database').configure(logger)
require('../settings/offline-processor').configure(logger)
offline.listen(require('@open-age/logger')('LISTEN'))

logger.end()
