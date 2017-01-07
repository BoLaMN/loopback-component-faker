var async, faker, fs, isFunction, path;

faker = require('faker');

fs = require('fs');

path = require('path');

async = require('async');

isFunction = require('lodash').isFunction;

module.exports = function(server, options) {
  var create, depslist, destroy, do_fake, do_fake_embeds, dstry, fake, fakeModels, fakerFolderContents, fakerPath, loadFakeModel, models, start;
  models = server.models;
  destroy = [];
  create = [];
  depslist = {};
  faker.model = {};
  faker.random.model = function(model_name, i) {
    var idx, index, randomModel;
    randomModel = faker.random[model_name];
    if (!(randomModel != null ? randomModel.length : void 0)) {
      console.error('no data found for ' + model_name);
      return {};
    }
    idx = randomModel.length - 1;
    if (idx < 0) {
      idx = 0;
    }
    index = faker.random.number({
      min: 0,
      max: idx
    });
    return randomModel[i || index] || {};
  };
  fakerPath = __dirname + '/data/';
  fakerFolderContents = fs.readdirSync(fakerPath);
  fakeModels = fakerFolderContents.filter(function(fileName) {
    return fileName.match(/\.js$/);
  });
  loadFakeModel = function(fakeJs, done) {
    var fakeName, fakemodel;
    fakeName = fakeJs.replace('.js', '');
    fakemodel = require(fakerPath + fakeJs)(faker);
    fakemodel.model_name = fakeName;
    destroy.push(fakeName);
    create.push(fakemodel);
    return done();
  };
  dstry = function(model_name, done) {
    if (!models[model_name]) {
      return done(new Error('no model found for' + model_name));
    }
    return models[model_name].destroyAll(function(err, resp) {
      return done();
    });
  };
  do_fake_embeds = function(model_inst, model_embeds, callback) {
    var embedNames;
    if (model_embeds == null) {
      model_embeds = {};
    }
    embedNames = Object.keys(model_embeds);
    return async.eachSeries(embedNames, function(embedName, done) {
      var count, embeds, iterator, model, ref;
      if (!isFunction(model_embeds[embedName])) {
        throw new Error('no model embed found for ' + embedName);
      }
      ref = model_embeds[embedName](), count = ref.count, model = ref.model, embeds = ref.embeds;
      iterator = function(i, next) {
        var modelData;
        modelData = model(i);
        if (!isFunction(model_inst[embedName])) {
          throw new Error('no model embed found for ' + embedName);
        }
        return model_inst[embedName].create(modelData, function(err, data) {
          var base;
          if (err) {
            throw new Error(err);
            if ((base = faker.random)[embedName] == null) {
              base[embedName] = [];
            }
            faker.random[embedName].push(data);
          }
          return do_fake_embeds(data, embeds, next);
        });
      };
      return async.timesSeries(count, iterator, done);
    }, callback);
  };
  do_fake = function(model_name, model, embeds, i, callback) {
    if (!models[model_name]) {
      return callback(new Error('no model found for' + model_name));
    }
    return models[model_name].create(model(i), function(err, instance) {
      var base;
      if (err) {
        throw new Error(err);
      }
      if ((base = faker.random)[model_name] == null) {
        base[model_name] = [];
      }
      faker.random[model_name].push(instance.toObject());
      if (embeds) {
        return do_fake_embeds(instance, embeds, callback);
      } else {
        return callback(err, instance);
      }
    });
  };
  fake = function(config, next) {
    var count, deps, embeds, iterator, model, model_name;
    model_name = config.model_name, model = config.model, embeds = config.embeds, count = config.count, deps = config.deps;
    iterator = function(i, callback) {
      return do_fake(model_name, model, embeds, i, callback);
    };
    deps = (deps || []).filter(function(dep) {
      return !faker.random[dep];
    });
    if (deps != null ? deps.length : void 0) {
      async.each(deps, function(dep, cb) {
        if (depslist[dep] == null) {
          depslist[dep] = [];
        }
        depslist[dep].push(config);
        return cb();
      }, next);
    } else {
      return async.timesSeries(count, iterator, function(err) {
        if (err) {
          throw new Error(err);
        }
        if (depslist[model_name]) {
          return async.each(depslist[model_name], function(dep, cb) {
            return fake(dep, cb);
          }, next);
        } else {
          return next();
        }
      });
    }
  };
  start = function() {
    var fns;
    fns = [];
    destroy.forEach(function(model_name) {
      return fns.push(function(done) {
        return dstry(model_name, done);
      });
    });
    create.forEach(function(model) {
      return fns.push(function(done) {
        return fake(model, done);
      });
    });
    return async.series(fns, function(err) {
      if (err) {
        console.error('something went wrong ' + err);
        return;
      }
      server.emit('faker loaded', faker.random);
      return console.log('inserted fake data');
    });
  };
  if (options.loadFaker) {
    async.eachSeries(fakeModels, loadFakeModel, function() {
      return start();
    });
    server.faker = faker;
  }
};
