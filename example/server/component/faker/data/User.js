module.exports = function(faker) {
  return {
    embeds: {},

    model: function(i) {
      return {
        givenName: faker.name.firstName(),
        familyName: faker.name.lastName(),
        email: faker.internet.email(),
        password: 'password' + i
      };
    },
    count: 3
  };
};
