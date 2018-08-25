/**
 * Created by kuan on 2018/8/25.
 */
var Sequelize = require('sequelize'),
    sequelize = new Sequelize('questionaire', null, null, {
        host: 'localhost',
        dialect: 'sqlite',
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        // SQLite only
        storage: './questionaire.sqlite',
        // http://docs.sequelizejs.com/manual/tutorial/querying.html#operators
        operatorsAliases: false
    });
const question = sequelize.define('question', {
    id:{
        type: Sequelize.STRING,
        primaryKey: true
    },
    description: {
        type: Sequelize.STRING
    }
});
const answer = sequelize.define('answer', {
    option: {
        type: Sequelize.STRING
    },
    count: {
        type: Sequelize.INTEGER
    }
});

question.hasMany(answer);

var models = {
    orm: sequelize,
    question: question,
    answer: answer
};

exports.models = models;