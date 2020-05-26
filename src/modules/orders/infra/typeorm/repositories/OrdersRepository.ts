import { getRepository, Repository } from 'typeorm';

import IOrdersRepository from '@modules/orders/repositories/IOrdersRepository';
import ICreateOrderDTO from '@modules/orders/dtos/ICreateOrderDTO';
import Order from '../entities/Order';

class OrdersRepository implements IOrdersRepository {
  private ormRepository: Repository<Order>;

  constructor() {
    this.ormRepository = getRepository(Order);
  }

  public async create({ customer, products }: ICreateOrderDTO): Promise<Order> {
    const order = await this.ormRepository.create({
      customer,
      order_products: products,
    });

    await this.ormRepository.save(order);

    const orderFormatted = await this.ormRepository
      .createQueryBuilder('order')
      .where({ id: order.id })
      .leftJoin('order.customer', 'customer')
      .leftJoin('order.order_products', 'order_products')
      .addSelect([
        'customer.id',
        'customer.name',
        'customer.email',
        'order_products.product_id',
        'order_products.price',
        'order_products.quantity',
      ])
      .getOne();

    return orderFormatted || order;
  }

  public async findById(id: string): Promise<Order | undefined> {
    const order = await this.ormRepository
      .createQueryBuilder('order')
      .where({ id })
      .leftJoin('order.customer', 'customer')
      .leftJoin('order.order_products', 'order_products')
      .addSelect([
        'customer.id',
        'customer.name',
        'customer.email',
        'order_products.product_id',
        'order_products.price',
        'order_products.quantity',
      ])
      .getOne();

    return order;
  }
}

export default OrdersRepository;
