import { TelegramClient } from "telegram";
import { StoreSession } from "telegram/sessions/index.js";
import { text } from 'input'
import { EventEmitter } from 'emitter'

import { Channels } from "../database/db"; 
import { processMessage } from "../processor/BurnedLPParser";
 import TokenCheckService from "../api/TokenCheckService";
import logger from "./Logger";

class TelegramAccountService {
    client: TelegramClient;
    channels: any[];
    botClient: TelegramClient;
    em: EventEmitter;
    chatIds: any[];
    channelMaps: any[];  
    config:any;


    constructor(config: any, em: EventEmitter) {

        this.client = new TelegramClient(new StoreSession(config.dataStoragePath), config.telegram_api_id, config.telegram_api_hash, {});
        this.channels = config.followChannels; 
        this.chatIds = [];
        this.em = em;
        this.channelMaps = [];
        this.initClient(); 

    }

    disconnect = () => {

        this.client.disconnect();
    }

    getGroupChatIdByName = async () => { 
        try {
            const dialogs = await this.client.getDialogs(); 
            dialogs.forEach((element: any) => { 
                if (element.entity?.className === 'Channel') {
                    if (Number(element.dialog.peer?.channelId)
                        && (this.channels.includes(element?.entity?.username) || this.channels.includes(element?.entity?.title))
                    ) {
                        this.chatIds.push(Number(element.dialog?.peer?.channelId));
                        this.channelMaps.push({
                            name: element?.entity?.username,
                            title: element?.entity?.title,
                            id: Number(element.dialog.peer?.channelId), 
                        })
                    }
                } else if (element.entity?.className === 'Chat' && (this.channels.includes(element?.entity?.username) || this.channels.includes(element?.entity?.title)
                   )
                ) {
                    this.chatIds.push(Number(element.entity?.id));
                    this.channelMaps.push({
                        name: element?.entity?.title,
                        title: element?.entity?.title,
                        id: Number(element.entity?.id), 
                    })


                }

               
            });



            //console.log(this.channelMaps.length);

            if (this.channelMaps.length > 0) {

                this.channelMaps.forEach(async (element: any) => {
                    const cnl = {
                        channelId: Number(element.id),
                        channelName: element?.name,
                        channelTitle: element?.title,
                        enabled: true, 
                    }

                    const chnl = await Channels.upsert(cnl).then((result) => result);
                });

                await this.subscribe();

            }

            console.log(this.channelMaps);

        } catch (error) {
            //console.log(error)
            throw new Error(`Group not found.`);

        } finally {
            //console.log(this.channelMaps);
        }
    }


    initClient = async () => {


        //console.log("starting" );


        await this.client.start({
            phoneNumber: async () => await text("Please enter your number: "),
            password: async () => await text("Please enter your password: "),
            phoneCode: async () =>
                await text("Please enter the code you received: "),
            onError: (err: any) => console.log(err),
        });

        const me = await this.client.getMe();
        //console.log("starting me" );

        if (me) {
            //console.log("starting getGroupChatIdByName" );

            this.getGroupChatIdByName();
        }

    }


    subscribe = async () => {
        //console.log("starting   subscribe" ); 

        this.client.addEventHandler(async (event: any) => {
            if (event?.message) {
                // 
                ////console.log(this.chatIds); 

                const chatId = event.message?.peerId?.channelId ? event.message?.peerId?.channelId : event.message?.peerId?.chatId;

                if (this.chatIds.includes(Number(chatId))) {

                     logger.info('------------------------------------------------------');
                     logger.info(' Message from ' + this.channelMaps.find((item) => item.id === Number(chatId)).title);
                     logger.info('Analyziz in Progress');
                    let data = await processMessage(event.message); 
                    if (data) {   
                        logger.info(JSON.stringify(data));  
                            this.em.emit('newSignal', data);  
                    }
                }  
            }



        })
    }

 

}


export default TelegramAccountService;