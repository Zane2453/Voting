/**
 * Created by kuan on 2018/8/25.
 */
// http://docs.sequelizejs.com/manual/tutorial/querying.html
let config = require('./config'),
    Sequelize = require('sequelize'),
    sequelize;
if(config.db === 'sqlite'){
    sequelize = new Sequelize('questionnaire', null, null, {
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
            max: 100,
            min: 10,
            acquire: 30000,
            idle: 10000
        },
        // SQLite only
        storage: './voting.sqlite',
    });
}
else if(config.db === 'mysql'){
    sequelize = new Sequelize('voting', config.dbUser, config.dbPassword, {
        define: {
            charset: 'utf8',
            dialectOptions: {
                collate: 'utf8_general_ci'
            }
        },
        logging: false,
        host: config.dbHost,
        dialect: 'mysql',
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
    });
}
const questionnaire = sequelize.define('questionnaire', {
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

const question = sequelize.define('question', {
    description: {
        type: Sequelize.STRING
    },
    image: {
        type: Sequelize.STRING
    }
});
const answer = sequelize.define('answer', {
    description: {
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

questionnaire.hasMany(question);
question.hasMany(answer);
vote.belongsTo(user);
vote.belongsTo(question);
vote.belongsTo(answer);

let models = {
    orm: sequelize,
    questionnaire: questionnaire,
    question: question,
    answer: answer,
    user: user,
    vote: vote
};

exports.models = models;
