module.exports = function(faker) {
  return {
    embeds: {},

    model: function(i) {
      return {
        name: faker.company.companyName(),
        accountId: faker.finance.account(),
        email: faker.internet.email(),
        phone: faker.phone.phoneNumber()
      };
    },

    count: 5
  };
};
