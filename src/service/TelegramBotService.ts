import TelegramBot from 'node-telegram-bot-api';
import util from 'util';
import { shorten } from '../utils/index';

class TelegramBotService {

    client: TelegramBot;
    channels: any[];
    botAuthToken: any;

    formatter: any;

    constructor(config: any) {

        this.client = new TelegramBot(config.botAuthToken, { polling: true });

        this.botAuthToken = config.botAuthToken;
        this.formatter = Intl.NumberFormat('en', { notation: 'compact' });
    }

 


    subscribe = async () => {

      
    }

    initClient = async () => {

    }


}


export default TelegramBotService;