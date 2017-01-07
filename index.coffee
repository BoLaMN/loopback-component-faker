faker   = require 'faker'
fs = require 'fs'
path = require 'path'
async = require 'async'

{ isFunction } = require 'lodash'

module.exports = (server, options) ->
  { models } = server

  destroy = []
  create = []

  depslist = {}
  faker.model = {}

  faker.random.model = (model_name, i) ->
    randomModel = faker.random[model_name]

    if not randomModel?.length
      console.error 'no data found for ' + model_name
      return {}

    idx = (randomModel.length - 1)

    if idx < 0
      idx = 0

    index = faker.random.number
      min: 0
      max: idx

    randomModel[i or index] or {}

  fakerPath = __dirname + '/data/'
  fakerFolderContents = fs.readdirSync fakerPath

  fakeModels = fakerFolderContents.filter (fileName) ->
    fileName.match /\.js$/

  loadFakeModel = (fakeJs, done) ->
    fakeName = fakeJs.replace '.js', ''

    fakemodel = require(fakerPath + fakeJs)(faker)
    fakemodel.model_name = fakeName

    destroy.push fakeName
    create.push fakemodel

    done()

  dstry = (model_name, done) ->
    if not models[model_name]
      return done new Error 'no model found for' + model_name

    models[model_name].destroyAll (err, resp) ->
      done()

  do_fake_embeds = (model_inst, model_embeds = {}, callback) ->
    embedNames = Object.keys model_embeds

    async.eachSeries embedNames, (embedName, done) ->
      if not isFunction model_embeds[embedName]
        throw new Error 'no model embed found for ' + embedName

      { count, model, embeds } = model_embeds[embedName]()

      iterator = (i, next) ->
        modelData = model(i)

        if not isFunction model_inst[embedName]
          throw new Error 'no model embed found for ' + embedName

        model_inst[embedName].create modelData, (err, data) ->
          if err
            throw new Error err

            faker.random[embedName] ?= []
            faker.random[embedName].push data

          do_fake_embeds data, embeds, next

      async.timesSeries count, iterator, done
    , callback

  do_fake = (model_name, model, embeds, i, callback) ->
    if not models[model_name]
      return callback new Error 'no model found for' + model_name

    models[model_name].create model(i), (err, instance) ->
      if err
        throw new Error err

      faker.random[model_name] ?= []
      faker.random[model_name].push instance.toObject()

      if embeds
        do_fake_embeds instance, embeds, callback
      else callback err, instance

  fake = (config, next) ->
    { model_name, model, embeds, count, deps } = config

    iterator = (i, callback) ->
      do_fake model_name, model, embeds, i, callback

    deps = (deps or []).filter (dep) ->
      not faker.random[dep]

    if deps?.length
      async.each deps, (dep, cb) ->
        depslist[dep] ?= []
        depslist[dep].push config
        cb()
      , next
      return
    else
      async.timesSeries count, iterator, (err) ->
        if err
          throw new Error err

        if depslist[model_name]
          async.each depslist[model_name], (dep, cb) ->
            fake dep, cb
          , next
        else
          next()

  start = ->
    fns = []

    destroy.forEach (model_name) ->
      fns.push (done) -> dstry model_name, done

    create.forEach (model) ->
      fns.push (done) -> fake model, done

    async.series fns, (err) ->
      if err
        console.error 'something went wrong ' + err
        return

      server.emit 'faker loaded', modelData

      console.log 'inserted fake data'

  if options.loadFaker
    async.eachSeries fakeModels, loadFakeModel, ->
      start()

    server.faker = faker

  return