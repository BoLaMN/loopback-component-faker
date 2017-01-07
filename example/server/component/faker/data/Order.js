module.exports = function(faker) {
  return {
    embeds: {},

    model: function(i) {
      return {
        userId: faker.random.model('User').id,
        customerId: faker.random.model('Customer').id
      };
    },
    deps: ['Customer', 'User'],
    count: 30
  };
};
