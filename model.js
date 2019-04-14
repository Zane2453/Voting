/**
 * Created by kuan on 2018/8/25.
 */
// http://docs.sequelizejs.com/manual/tutorial/querying.html
var Sequelize = require('sequelize'),
    sequelize = new Sequelize('questionaire', null, null, {
        define: {
            charset: 'utf8',
            dialectOptions: {
                collate: 'utf8_general_ci'
            }
        },
        logging: false,
        host: 'localhost',
        dialect: 'sqlite',
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        // SQLite only
        storage: './questionnaire.sqlite',
        operatorsAliases: false
    });
const question = sequelize.define('question', {
    id:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    uuid:{
        type: Sequelize.STRING
    },
    description: {
        type: Sequelize.STRING
    },
    anonymous: {
        type: Sequelize.BOOLEAN
    },
    image: {
        type: Sequelize.STRING
    }
});
const answer = sequelize.define('answer', {
    option: {
        type: Sequelize.STRING
    },
    count: {
        type: Sequelize.INTEGER
    },
    color:{
        type: Sequelize.STRING
    }
});
const user = sequelize.define('user', {
    id: {
        type: Sequelize.STRING,
        primaryKey: true
    },
    name: {
        type: Sequelize.STRING
    },
    photo:{
        type: Sequelize.STRING
    },
    provider:{
        type: Sequelize.STRING
    }
});
const vote = sequelize.define('vote', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true
    }
});

question.hasMany(answer);
vote.belongsTo(user);
vote.belongsTo(question);
vote.belongsTo(answer);

var models = {
    orm: sequelize,
    question: question,
    answer: answer,
    user: user,
    vote: vote
};

exports.models = models;
