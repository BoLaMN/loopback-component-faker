module.exports = (faker) ->
  embeds: {}

  model: (i) ->
    givenName: faker.name.firstName()
    familyName: faker.name.lastName()
    email: faker.internet.email()
    password: i

  count: 3