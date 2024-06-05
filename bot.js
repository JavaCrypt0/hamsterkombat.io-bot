let Client = require('./patch')
let config = require('./conf.json')
new Client(config["hamster-token"]).start(config)
