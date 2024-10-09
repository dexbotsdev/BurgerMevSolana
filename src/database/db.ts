import { Sequelize, DataTypes, Model } from 'sequelize';

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './data/burgersniper.sqlite',
  logging: false,
  pool: {
    max: 100,
    min: 5,
    acquire: 1000,
    idle: 10
  }
});


class TokenLogs extends Model {
};



class TradeTrigger extends Model {
};




TokenLogs.init({
  // Model attributes are defined here
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tokenAddress: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  poolData: {
    type: DataTypes.STRING,
    allowNull: false,
  }
},
  {
    tableName: 'TokenLogs',
    sequelize,
  });

TradeTrigger.init({
  // Model attributes are defined here
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userSoldToken: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  userSoldAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  userSoldSol: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  timeOfsellOff: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  userAddress: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  newTrigger: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  }
},
  {
    tableName: 'TradeTrigger',
    sequelize,
  });



export { TokenLogs, TradeTrigger };