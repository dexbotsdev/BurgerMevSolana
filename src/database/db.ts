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


class TradeLogs extends Model { 
};



class TokenCalls extends Model { 
};


class UpdateLogs extends Model{ 

}
 
    
TradeLogs.init({
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
  tokenSymbol: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  buyTime: {
    type: DataTypes.DATE,
    defaultValue:Date.now(),
    allowNull: false,
  },
  buyAmount: {
    type: DataTypes.NUMBER,
    defaultValue:0,
    allowNull: false,
  }, 
  avgBuyPrice: {
    type: DataTypes.NUMBER,
    defaultValue:0,
    allowNull: false,
  }, 
  tokenBalance: {
    type: DataTypes.NUMBER,
    defaultValue:0,
    allowNull: false,
  },  
  sellTime: {
    type: DataTypes.DATE,
    allowNull: true,
  }, 
  sellAmount: {
    type: DataTypes.NUMBER,
    defaultValue:0,
    allowNull: false,
  }, 
  sold: {
    type: DataTypes.BOOLEAN,
    defaultValue:false,
    allowNull: false,
  }, 
},
  {
    tableName: 'TradeLogs',
    sequelize,
  });

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
  
 
      
export { TokenCalls, Channels ,UpdateLogs,TradeLogs };