module.exports = (faker) ->

  embeds:
    address: ->
      model: (i) ->
        number: faker.random.number()
        street: faker.address.streetName()
        type: faker.address.streetSuffix()
        postCode: faker.random.number()
        city: faker.address.city()
        country: faker.address.country()
      count: 1
    contact: ->
      model: (i) ->
        name: faker.name.firstName() + ' ' + faker.name.lastName()
        emails: [
          {
            label: faker.random.arrayElement [ 'work', 'home', 'personal' ]
            address: faker.internet.email().toLowerCase()
          }
        ]
        numbers: [
          {
            label: faker.random.arrayElement [ 'work', 'home', 'fax', 'mobile' ]
            number: faker.phone.phoneNumber()
          }
        ]
      count: 2

  model: (i) ->
    name: faker.company.companyName()
    accountId: faker.finance.account()
    email: faker.internet.email()
    phone: faker.phone.phoneNumber()

  count: 5
