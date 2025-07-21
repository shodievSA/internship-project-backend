import type { Channel, ConsumeMessage } from 'amqplib';
import { GmailSenderFactory, GmailType } from '@/services/gmaiService';

export function consumeEmailQueue(channel: Channel): void {

    channel.consume('email_sender', async (msg: ConsumeMessage | null): Promise<void> => {

        if (!msg) return;

        try {

            const {

                type,
                receiverEmail,
                params

            }: {

                type: GmailType;
                receiverEmail: string;
                params: any;

            } = JSON.parse(msg.content.toString());

            await GmailSenderFactory.sendGmail(type).sendGmail(receiverEmail, params);

            channel.ack(msg);            
            
        } catch (error) {

            console.error('Error processing email message:', error);
            channel.nack(msg, false, false); 
            
        }

    });

}