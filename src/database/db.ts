import { Sequelize, DataTypes, Model } from 'sequelize';

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './data/butosniper.sqlite',
  logging: false,
  pool: {
    max: 100,
    min: 5,
    acquire: 1000,
    idle: 10
  }
});


class TokenCalls extends Model { 
};


class UpdateLogs extends Model{ 

}


UpdateLogs.init({
  // Model attributes are defined here
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  lastMessageId: {
    type: DataTypes.INTEGER, 
    unique:true,
    allowNull: false
  },
  tokenAddress: {
    type: DataTypes.STRING,
    allowNull: true
  }, 
},
  {
    tableName: 'UpdateLogs',
    sequelize,
  });

  class Channels extends Model {

  }; 
    
TokenCalls.init({
  // Model attributes are defined here
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  }, 
  tokenAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  pairAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  tokenSymbol: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  tokenName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  tokenAge: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  tokenMC: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  liquidity: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  currPrice: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  athROI: {
    type: DataTypes.STRING,
    defaultValue:"0.0",
    allowNull: true,
  },
  chainId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  dex: {
    type: DataTypes.STRING,
    allowNull: false,
  }, 
},
  {
    tableName: 'TokenCalls',
    sequelize,
  });

  Channels.init({
    // Model attributes are defined here
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    channelId: {
      type: DataTypes.INTEGER, 
      unique:true,
      allowNull: false
    },
    channelName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    channelTitle: {
      type: DataTypes.STRING,
      allowNull: true
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue:false,
      allowNull: true,
    }, 
    isAlpha: {
      type: DataTypes.BOOLEAN,
      defaultValue:false,
      allowNull: true,
    }, 
  },
    {
      tableName: 'Channels',
      sequelize,
    });
  
 
      
export { TokenCalls, Channels ,UpdateLogs };