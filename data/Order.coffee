module.exports = (faker) ->

  embeds: {}

  model: (i) ->
    userId: faker.random.model('User').id
    customerId: faker.random.model('Customer').id

  deps: [ 'Customer', 'User' ]
  count: 30