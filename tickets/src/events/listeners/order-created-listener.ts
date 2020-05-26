import { Message } from 'node-nats-streaming';
import { Listener, OrderCreatedEvent, Subjects } from '@sptickets/common';

import { queueGroupName } from './queueGroupName';
import { Ticket } from '../../models/ticket';
import { TicketUpdatedPublisher } from '../publishers/ticket-updated-publisher';

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  subject: Subjects.OrderCreated = Subjects.OrderCreated;

  queueGroupName = queueGroupName;

  async onMessage(data: OrderCreatedEvent['data'], msg: Message) {
    // find the ticket that the order is reserving
    const ticket = await Ticket.findById(data.ticket.id);

    // if no ticket, throw error
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // mark the ticket as being reserved by setting its orderI property
    ticket.set({ orderId: data.id });

    // save the ticket
    await ticket.save();
    new TicketUpdatedPublisher(this.client);

    // ack the message
    msg.ack();
  }
}
